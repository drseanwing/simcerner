/**
 * @file DeteriorationView.tsx
 * @description Deterioration / vital signs view composing Q-ADDS scoring,
 * colour-coded vital signs flowsheet, escalation protocol, and score trend.
 *
 * Replaces and enhances the original VitalsView from emr-sim-v2.html by
 * integrating the Q-ADDS scoring engine and providing richer clinical
 * decision support visualisations.
 */

import { useMemo } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import { calculateQADDS } from '../../services/newsCalculator';
import type { QADDSResult } from '../../types';
import NewsScoreCard from './NewsScoreCard';
import VitalSignsFlowsheet from './VitalSignsFlowsheet';
import EscalationProtocol from './EscalationProtocol';
import ScoreTrendGraph from './ScoreTrendGraph';
import METCallBanner from '../met-meo/METCallBanner';
import METMEOPanel from '../met-meo/METMEOPanel';
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

  /** Q-ADDS result from the most recent vital sign set. */
  const latestResult: QADDSResult | null = useMemo(() => {
    if (!patient?.vitals?.length) return null;
    return calculateQADDS(patient.vitals[0]);
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
      <div className="content-header">Managing Deterioration</div>
      <div className="content-body">
        {latestResult ? (
          <>
            {/* MET Call Banner — shown when EWS >= 8 or E-zone */}
            <METCallBanner
              ewsScore={latestResult.totalScore}
              hasEZone={latestResult.hasEZone}
              eZoneParameters={latestResult.eZoneParameters}
            />

            {/* Score card + escalation side-by-side on wide screens */}
            <div className="deterioration-top-row">
              <NewsScoreCard result={latestResult} />
              <EscalationProtocol
                score={latestResult.totalScore}
                clinicalRisk={latestResult.riskLevel}
              />
            </div>

            {/* MET-MEO Plan panel — below escalation protocol */}
            {(latestResult.hasEZone || latestResult.totalScore >= 8) && (
              <METMEOPanel
                patientId={patient.mrn}
                ewsScore={latestResult.totalScore}
                hasEZone={latestResult.hasEZone}
                eZoneParameters={latestResult.eZoneParameters}
              />
            )}

            {/* Colour-coded vital signs flowsheet */}
            <div className="vitals-chart mb-10">
              <div className="chart-header">Vital Signs Flowsheet</div>
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
