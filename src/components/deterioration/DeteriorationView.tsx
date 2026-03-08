/**
 * @file DeteriorationView.tsx
 * @description Deterioration / vital signs view composing Q-ADDS scoring,
 * colour-coded vital signs flowsheet, escalation protocol, and score trend.
 *
 * Replaces and enhances the original VitalsView from emr-sim-v2.html by
 * integrating the Q-ADDS scoring engine and providing richer clinical
 * decision support visualisations.
 *
 * Track B integration adds MEO Plan management (MeoPlanSection, MeoPlanDialog,
 * MetMeoPlanOrderForm, ModifiedObsFrequencyForm), sedation scoring, Q-ADDS
 * score card, and the Discern Alert system.
 */

import { useEffect, useMemo } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import { useMeoStore } from '../../stores/meoStore';
import { useAlertStore } from '../../stores/alertStore';
import { calculateQADDS } from '../../services/newsCalculator';
import { evaluateAlerts } from '../../services/alertEngine';
import type { QADDSResult } from '../../types';
import NewsScoreCard from './NewsScoreCard';
import VitalSignsFlowsheet from './VitalSignsFlowsheet';
import EscalationProtocol from './EscalationProtocol';
import ScoreTrendGraph from './ScoreTrendGraph';
import { QaddsScoreCard } from './QaddsScoreCard';
import { MeoPlanSection } from './MeoPlanSection';
import { MeoPlanDialog } from './MeoPlanDialog';
import { MetMeoPlanOrderForm } from './MetMeoPlanOrderForm';
import { ModifiedObsFrequencyForm } from './ModifiedObsFrequencyForm';
import { SedationScore } from './SedationScore';
import { AlertDialog } from './AlertDialog';
import METCallBanner from '../met-meo/METCallBanner';
import METMEOPanel from '../met-meo/METMEOPanel';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DeteriorationView is the primary clinical deterioration management screen.
 *
 * It composes the following sub-components:
 *
 * Track A (original):
 * 1. {@link METCallBanner} — MET call alert banner
 * 2. {@link NewsScoreCard} — aggregate score with risk badge
 * 3. {@link EscalationProtocol} — recommended clinical response
 * 4. {@link METMEOPanel} — MET-MEO Plan panel (conditional)
 * 5. {@link VitalSignsFlowsheet} — colour-coded flowsheet grid
 * 6. {@link ScoreTrendGraph} — score trend over time
 *
 * Track B (integrated):
 * 7. {@link QaddsScoreCard} — Q-ADDS score card alongside NewsScoreCard
 * 8. {@link MeoPlanSection} — MEO Plan status section
 * 9. {@link SedationScore} — sedation score reference and assessments
 * 10. {@link MeoPlanDialog} — modal for MEO Plan management
 * 11. {@link MetMeoPlanOrderForm} — modal for MET-MEO Plan ordering
 * 12. {@link ModifiedObsFrequencyForm} — modal for modified obs frequency ordering
 * 13. {@link AlertDialog} — Discern Alert modal
 */
export default function DeteriorationView() {
  const patient = usePatientStore((s) => s.currentPatient);

  // ---------------------------------------------------------------------------
  // Alert store selectors
  // ---------------------------------------------------------------------------
  const addAlerts = useAlertStore((s) => s.addAlerts);
  const setActiveAlert = useAlertStore((s) => s.setActiveAlert);
  const activeAlert = useAlertStore((s) => s.activeAlert);
  const acknowledgeAlert = useAlertStore((s) => s.acknowledgeAlert);

  // ---------------------------------------------------------------------------
  // MEO store selectors
  // ---------------------------------------------------------------------------
  const showMeoDialog = useMeoStore((s) => s.showMeoDialog);
  const openMeoDialog = useMeoStore((s) => s.openMeoDialog);
  const closeMeoDialog = useMeoStore((s) => s.closeMeoDialog);
  const showMetMeoForm = useMeoStore((s) => s.showMetMeoForm);
  const openMetMeoForm = useMeoStore((s) => s.openMetMeoForm);
  const closeMetMeoForm = useMeoStore((s) => s.closeMetMeoForm);
  const showMofForm = useMeoStore((s) => s.showMofForm);
  const openMofForm = useMeoStore((s) => s.openMofForm);
  const closeMofForm = useMeoStore((s) => s.closeMofForm);
  const getActiveMetMeo = useMeoStore((s) => s.getActiveMetMeo);
  const getActiveMof = useMeoStore((s) => s.getActiveMof);
  const addMetMeoOrder = useMeoStore((s) => s.addMetMeoOrder);
  const cancelMetMeoOrder = useMeoStore((s) => s.cancelMetMeoOrder);
  const addMofOrder = useMeoStore((s) => s.addMofOrder);
  const cancelMofOrder = useMeoStore((s) => s.cancelMofOrder);
  const sedationAssessments = useMeoStore((s) => s.sedationAssessments);

  /** Q-ADDS result from the most recent vital sign set. */
  const latestResult: QADDSResult | null = useMemo(() => {
    if (!patient?.vitals?.length) return null;
    return calculateQADDS(patient.vitals[0]);
  }, [patient?.vitals]);

  // ---------------------------------------------------------------------------
  // Alert evaluation — runs when patient vitals change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!patient?.vitals?.length) return;
    const alerts = evaluateAlerts(patient.vitals[0]);
    if (alerts.length > 0) {
      addAlerts(alerts);
      // Show the first unacknowledged alert
      const firstUnacked = alerts.find((a) => !a.acknowledged);
      if (firstUnacked && !activeAlert) {
        setActiveAlert(firstUnacked);
      }
    }
  }, [patient?.vitals]); // eslint-disable-line react-hooks/exhaustive-deps

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

            {/* Score card + Q-ADDS card + escalation side-by-side on wide screens */}
            <div className="deterioration-top-row">
              <QaddsScoreCard vitals={patient.vitals[0]} />
              <NewsScoreCard result={latestResult} />
              <EscalationProtocol
                score={latestResult.totalScore}
                clinicalRisk={latestResult.riskLevel}
              />
            </div>

            {/* MET-MEO Plan panel — below escalation protocol (threshold lowered to >= 4) */}
            {(latestResult.hasEZone || latestResult.totalScore >= 4) && (
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

            {/* MEO Plan Section — Track B */}
            <MeoPlanSection
              activeMetMeo={getActiveMetMeo()}
              onOpenDialog={openMeoDialog}
            />

            {/* Sedation Score — Track B */}
            <SedationScore assessments={sedationAssessments} />
          </>
        ) : (
          <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
            No vital signs data available for deterioration assessment
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* Modal dialogs (rendered outside main flow)                           */}
      {/* ------------------------------------------------------------------- */}

      {/* MEO Plan Dialog */}
      {showMeoDialog && (
        <MeoPlanDialog
          onClose={closeMeoDialog}
          onOpenMetMeoForm={openMetMeoForm}
          onOpenMofForm={openMofForm}
          onCancelMetMeo={() => {
            const active = getActiveMetMeo();
            if (active) cancelMetMeoOrder(active.orderId);
          }}
          onCancelMof={() => {
            const active = getActiveMof();
            if (active) cancelMofOrder(active.orderId);
          }}
          hasActiveMetMeo={!!getActiveMetMeo()}
          hasActiveMof={!!getActiveMof()}
        />
      )}

      {/* MET-MEO Plan Order Form */}
      {showMetMeoForm && (
        <MetMeoPlanOrderForm
          onClose={closeMetMeoForm}
          onSubmit={(order) => {
            addMetMeoOrder(order);
            closeMetMeoForm();
          }}
          chartVariant="standard"
        />
      )}

      {/* Modified Observation Frequency Order Form */}
      {showMofForm && (
        <ModifiedObsFrequencyForm
          onClose={closeMofForm}
          onSubmit={(order) => {
            addMofOrder(order);
            closeMofForm();
          }}
        />
      )}

      {/* Discern Alert Dialog */}
      {activeAlert && (
        <AlertDialog
          alert={activeAlert}
          onDismiss={() => {
            if (activeAlert) {
              acknowledgeAlert(activeAlert.id);
              setActiveAlert(null);
            }
          }}
        />
      )}
    </>
  );
}
