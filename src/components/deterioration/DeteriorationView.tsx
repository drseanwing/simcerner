/**
 * @file DeteriorationView.tsx
 * @description Deterioration / vital signs view composing NEWS2 scoring,
 * colour-coded vital signs flowsheet, escalation protocol, and score trend.
 *
 * Replaces and enhances the original VitalsView from emr-sim-v2.html by
 * integrating the NEWS2 scoring engine and providing richer clinical
 * decision support visualisations.
 */

import { useMemo } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import { calculateNEWS2 } from '../../services/newsCalculator';
import type { NEWS2Result } from '../../types';
import NewsScoreCard from './NewsScoreCard';
import VitalSignsFlowsheet from './VitalSignsFlowsheet';
import EscalationProtocol from './EscalationProtocol';
import ScoreTrendGraph from './ScoreTrendGraph';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DeteriorationView is the primary clinical deterioration management screen.
 *
 * It composes four sub-components:
 * 1. {@link NewsScoreCard} — aggregate score with risk badge
 * 2. {@link VitalSignsFlowsheet} — colour-coded flowsheet grid
 * 3. {@link EscalationProtocol} — recommended clinical response
 * 4. {@link ScoreTrendGraph} — score trend over time
 */
export default function DeteriorationView() {
  const patient = usePatientStore((s) => s.currentPatient);

  /** NEWS2 result from the most recent vital sign set. */
  const latestResult: NEWS2Result | null = useMemo(() => {
    if (!patient?.vitals?.length) return null;
    return calculateNEWS2(patient.vitals[0]);
  }, [patient?.vitals]);

  if (!patient) {
    return (
      <div className="text-muted" style={{ padding: 20 }}>
        No patient selected
      </div>
    );
  }

  return (
    <>
      <div className="content-header">Managing Deterioration - Vital Signs</div>
      <div className="content-body">
        {latestResult ? (
          <>
            {/* Score card + flowsheet side-by-side on wide screens */}
            <div className="deterioration-top-row">
              <NewsScoreCard result={latestResult} />
              <EscalationProtocol
                score={latestResult.totalScore}
                clinicalRisk={latestResult.clinicalRisk}
              />
            </div>

            {/* Colour-coded vital signs flowsheet */}
            <div className="vitals-chart mb-10">
              <div className="chart-header">Vital Signs Flowsheet (NEWS2 Colour-Coded)</div>
              <VitalSignsFlowsheet vitals={patient.vitals} />
            </div>

            {/* Score trend graph */}
            <div className="vitals-chart mb-10">
              <div className="chart-header">Score Trend</div>
              <ScoreTrendGraph vitals={patient.vitals} />
            </div>
          </>
        ) : (
          <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
            No vital signs data available for deterioration assessment
          </div>
        )}
      </div>
    </>
  );
}
