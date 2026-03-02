/**
 * DeteriorationView — the main "Managing Deterioration" view that composes
 * all Q-ADDS sub-components into a unified deterioration monitoring page.
 *
 * Layout:
 *   1. Top section: QaddsScoreCard + EscalationProtocol (side by side)
 *   2. Middle section: VitalSignsFlowsheet (colour-coded table)
 *   3. Bottom section: ScoreTrendGraph
 *   4. AlertDialog overlay when alertStore.activeAlert is set
 *
 * On mount, the most recent vitals are evaluated by the alert engine and
 * any resulting alerts are pushed into the alert store.
 */

import { useEffect, useMemo } from 'react'
import type { Patient } from '@/types/patient'
import { calculateQadds } from '@/services/qaddsCalculator'
import { evaluateAlerts } from '@/services/alertEngine'
import { useAlertStore } from '@/stores/alertStore'
import { QaddsScoreCard } from '@/components/deterioration/QaddsScoreCard'
import { EscalationProtocol } from '@/components/deterioration/EscalationProtocol'
import { VitalSignsFlowsheet } from '@/components/deterioration/VitalSignsFlowsheet'
import { ScoreTrendGraph } from '@/components/deterioration/ScoreTrendGraph'
import { AlertDialog } from '@/components/deterioration/AlertDialog'

interface DeteriorationViewProps {
  patient: Patient
}

export function DeteriorationView({ patient }: DeteriorationViewProps) {
  const activeAlert = useAlertStore((s) => s.activeAlert)
  const addAlerts = useAlertStore((s) => s.addAlerts)
  const setActiveAlert = useAlertStore((s) => s.setActiveAlert)
  const acknowledgeAlert = useAlertStore((s) => s.acknowledgeAlert)
  const clearAlerts = useAlertStore((s) => s.clearAlerts)

  const mostRecentVitals = patient.vitals.length > 0 ? patient.vitals[0] : null

  const qaddsScore = useMemo(
    () => (mostRecentVitals ? calculateQadds(mostRecentVitals) : null),
    [mostRecentVitals],
  )

  // Evaluate alerts on mount (and when the most-recent vitals change)
  useEffect(() => {
    clearAlerts()

    if (!mostRecentVitals) return

    const alerts = evaluateAlerts(mostRecentVitals)
    if (alerts.length > 0) {
      addAlerts(alerts)
      // Show the highest-priority alert (first one is the most critical)
      setActiveAlert(alerts[0])
    }
  }, [mostRecentVitals, addAlerts, setActiveAlert, clearAlerts])

  function handleDismissAlert() {
    if (activeAlert) {
      acknowledgeAlert(activeAlert.id)
    }
    setActiveAlert(null)
  }

  if (!mostRecentVitals || !qaddsScore) {
    return (
      <>
        <div className="content-header">Managing Deterioration - Q-ADDS</div>
        <div className="content-body">
          <div
            style={{
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              fontSize: '12px',
              color: '#888',
              padding: '40px',
              textAlign: 'center',
            }}
          >
            No vital signs recorded for this patient.
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="content-header">Managing Deterioration - Q-ADDS</div>
      <div className="content-body">
        {/* Top section: Score Card + Escalation Protocol side by side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <QaddsScoreCard vitals={mostRecentVitals} />
          <EscalationProtocol risk={qaddsScore.clinicalRisk} />
        </div>

        {/* Middle section: Vital Signs Flowsheet */}
        <div style={{ marginBottom: '12px' }}>
          <VitalSignsFlowsheet vitals={patient.vitals} />
        </div>

        {/* Bottom section: Score Trend Graph */}
        <div style={{ marginBottom: '12px' }}>
          <ScoreTrendGraph vitals={patient.vitals} />
        </div>
      </div>

      {/* Alert Dialog overlay (renders only when activeAlert is set) */}
      {activeAlert && (
        <AlertDialog alert={activeAlert} onDismiss={handleDismissAlert} />
      )}
    </>
  )
}
