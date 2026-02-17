/**
 * @file VitalSignsFlowsheet.tsx
 * @description Colour-coded vital signs flowsheet replacing the plain table.
 *
 * Renders a grid where:
 * - Rows represent vital sign parameters (Temp, HR, RR, BP, SpO2, AVPU, O2)
 * - Columns represent time-based observation sets (most recent first)
 * - Each cell is background-coloured by its NEWS2 sub-score:
 *   white (0), yellow (1), orange (2), red (3)
 */

import { useMemo } from 'react';
import type { VitalSign, NEWS2SubScore } from '../../types';
import { calculateNEWS2 } from '../../services/newsCalculator';
import type { NEWS2Result } from '../../types';
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
 * with NEWS2 sub-score colouring per cell.
 */
export default function VitalSignsFlowsheet({
  vitals,
  maxColumns = 8,
}: VitalSignsFlowsheetProps) {
  const displayVitals = vitals.slice(0, maxColumns);

  /** Pre-compute NEWS2 results for each vital observation. */
  const newsResults = useMemo<NEWS2Result[]>(
    () => displayVitals.map((v) => calculateNEWS2(v)),
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
   * Look up the sub-score for a given parameter name from a NEWS2 result.
   */
  function getSubScore(result: NEWS2Result, paramName: string): number {
    const sub = result.subScores.find(
      (s: NEWS2SubScore) => s.parameter === paramName,
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

        {/* Aggregate NEWS2 row */}
        <div className="flowsheet-cell flowsheet-cell--label" style={{ fontWeight: 700 }}>
          NEWS2 Total
        </div>
        {newsResults.map((result, i) => {
          const score = result.totalScore;
          const scoreLevel = score >= 7 ? 3 : score >= 5 ? 2 : score >= 1 ? 1 : 0;
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
  newsResults: NEWS2Result[];
  render: (v: VitalSign) => string;
  getSubScore: (result: NEWS2Result, param: string) => number;
}) {
  return (
    <>
      <div className="flowsheet-cell flowsheet-cell--label">{label}</div>
      {vitals.map((v, i) => {
        const score = getSubScore(newsResults[i], newsParam);
        return (
          <div
            key={i}
            className="flowsheet-cell"
            style={{
              backgroundColor: `var(--news-score-${score})`,
              color: score >= 2 ? 'var(--news-score-text-light)' : 'var(--news-score-text-dark)',
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
