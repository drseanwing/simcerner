/**
 * @file VitalSignsFlowsheet.tsx
 * @description Colour-coded vital signs flowsheet replacing the plain table.
 *
 * Renders a grid where:
 * - Rows represent vital sign parameters (Temp, HR, RR, BP, SpO2, AVPU, O2)
 * - Columns represent time-based observation sets (most recent first)
 * - Each cell is background-coloured by its Q-ADDS sub-score:
 *   green (0), yellow (1), orange (2), deep-orange (3), purple (4/E)
 */

import { useMemo } from 'react';
import type { VitalSign, QADDSSubScore, QADDSScore } from '../../types';
import { calculateQADDS } from '../../services/newsCalculator';
import type { QADDSResult } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by VitalSignsFlowsheet. */
export interface VitalSignsFlowsheetProps {
  /** Array of vital sign observations, most recent first. */
  vitals: VitalSign[];
  /** Maximum number of time columns to display. */
  maxColumns?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a Q-ADDS sub-score to a CSS variable level.
 * 0→0, 1→1, 2→2, 3→3, 4→4, E→4
 */
function subScoreToLevel(score: QADDSScore): number {
  if (score === 'E') return 4;
  return score;
}

/**
 * Map an aggregate total score to a CSS variable level (Q-ADDS zones).
 */
function totalScoreToLevel(score: number): number {
  if (score >= 8) return 4;  // purple
  if (score >= 6) return 3;  // deep orange
  if (score >= 4) return 2;  // orange
  if (score >= 1) return 1;  // yellow
  return 0;                  // green
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Parameter row definitions mapping vital fields to display labels. */
const FLOWSHEET_PARAMS: Array<{
  label: string;
  newsParam: string;
  render: (v: VitalSign) => string;
}> = [
  { label: 'Temperature (°C)', newsParam: 'Temperature', render: (v) => (v.temp != null ? String(v.temp) : '—') },
  { label: 'Heart Rate (bpm)', newsParam: 'Heart Rate', render: (v) => (v.hr != null ? String(v.hr) : '—') },
  { label: 'Resp Rate (/min)', newsParam: 'Respiratory Rate', render: (v) => (v.rr != null ? String(v.rr) : '—') },
  { label: 'Systolic BP (mmHg)', newsParam: 'Systolic BP', render: (v) => (v.bp_sys != null ? String(v.bp_sys) : '—') },
  { label: 'SpO2 (%)', newsParam: 'SpO2', render: (v) => (v.spo2 != null ? String(v.spo2) : '—') },
  { label: 'AVPU', newsParam: 'Consciousness', render: (v) => (v.avpu ?? '—') },
  { label: 'Supplemental O2', newsParam: 'Supplemental O2', render: (v) => (v.supplementalO2 ? 'Yes' : 'No') },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * VitalSignsFlowsheet renders a colour-coded grid of vital sign observations
 * with Q-ADDS sub-score colouring per cell.
 */
export default function VitalSignsFlowsheet({
  vitals,
  maxColumns = 8,
}: VitalSignsFlowsheetProps) {
  const displayVitals = vitals.slice(0, maxColumns);

  /** Pre-compute Q-ADDS results for each vital observation. */
  const newsResults = useMemo<QADDSResult[]>(
    () => displayVitals.map((v) => calculateQADDS(v)),
    [displayVitals],
  );

  if (displayVitals.length === 0) {
    return (
      <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
        No vital signs recorded
      </div>
    );
  }

  /**
   * Look up the sub-score for a given parameter name from a Q-ADDS result.
   */
  function getSubScore(result: QADDSResult, paramName: string): QADDSScore {
    const sub = result.subScores.find(
      (s: QADDSSubScore) => s.parameter === paramName,
    );
    return sub?.score ?? 0;
  }

  return (
    <div className="flowsheet-wrapper">
      <div
        className="flowsheet-grid"
        style={{
          gridTemplateColumns: `140px repeat(${displayVitals.length}, minmax(80px, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="flowsheet-cell flowsheet-cell--header">Parameter</div>
        {displayVitals.map((v, i) => (
          <div key={i} className="flowsheet-cell flowsheet-cell--header">
            {v.datetime}
          </div>
        ))}

        {/* Parameter rows */}
        {FLOWSHEET_PARAMS.map((param) => (
          <FlowsheetRow
            key={param.label}
            label={param.label}
            newsParam={param.newsParam}
            vitals={displayVitals}
            newsResults={newsResults}
            render={param.render}
            getSubScore={getSubScore}
          />
        ))}

        {/* Aggregate EWS row */}
        <div className="flowsheet-cell flowsheet-cell--label" style={{ fontWeight: 700 }}>
          EWS Total
        </div>
        {newsResults.map((result, i) => {
          const score = result.totalScore;
          const scoreLevel = totalScoreToLevel(score);
          return (
            <div
              key={i}
              className="flowsheet-cell"
              style={{
                backgroundColor: `var(--news-score-${scoreLevel})`,
                color: scoreLevel >= 2 ? 'var(--news-score-text-light)' : 'var(--news-score-text-dark)',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              {score}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single parameter row in the flowsheet grid. */
function FlowsheetRow({
  label,
  newsParam,
  vitals,
  newsResults,
  render,
  getSubScore,
}: {
  label: string;
  newsParam: string;
  vitals: VitalSign[];
  newsResults: QADDSResult[];
  render: (v: VitalSign) => string;
  getSubScore: (result: QADDSResult, param: string) => QADDSScore;
}) {
  return (
    <>
      <div className="flowsheet-cell flowsheet-cell--label">{label}</div>
      {vitals.map((v, i) => {
        const score = getSubScore(newsResults[i], newsParam);
        const level = subScoreToLevel(score);
        return (
          <div
            key={i}
            className="flowsheet-cell"
            style={{
              backgroundColor: `var(--news-score-${level})`,
              color: level >= 2 ? 'var(--news-score-text-light)' : 'var(--news-score-text-dark)',
              textAlign: 'center',
            }}
          >
            {render(v)}
          </div>
        );
      })}
    </>
  );
}
