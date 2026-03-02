/**
 * DeteriorationView — the main "Managing Deterioration" view that composes
 * all Q-ADDS sub-components into a unified deterioration monitoring page.
 *
 * Layout:
 *   1. Top controls: Chart variant selector + Patient status toggle
 *   2. Warning banner (when vitals incomplete)
 *   3. Score Card + Escalation Protocol (side by side)
 *   4. Vital Signs Flowsheet (colour-coded table)
 *   5. Score Trend Graph
 *   6. AlertDialog overlay when alertStore.activeAlert is set
 *
 * On mount, the most recent vitals are evaluated by the alert engine and
 * any resulting alerts are pushed into the alert store.
 */

import { useState, useEffect, useMemo } from 'react'
import type { Patient } from '@/types/patient'
import type { ChartVariant, PatientStatus, QaddsParameter } from '@/types/vitals'
import {
  calculateQadds,
  validateVitalsComplete,
} from '@/services/qaddsCalculator'
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

const FONT_FAMILY = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

const PARAMETER_DISPLAY_NAMES: Record<QaddsParameter, string> = {
  rr: 'Respiratory Rate',
  spo2: 'SpO\u2082',
  o2FlowRate: 'O\u2082 Flow Rate',
  systolicBP: 'Systolic BP',
  heartRate: 'Heart Rate',
  temperature: 'Temperature',
  consciousness: 'Consciousness',
}

export function DeteriorationView({ patient }: DeteriorationViewProps) {
  const activeAlert = useAlertStore((s) => s.activeAlert)
  const addAlerts = useAlertStore((s) => s.addAlerts)
  const setActiveAlert = useAlertStore((s) => s.setActiveAlert)
  const acknowledgeAlert = useAlertStore((s) => s.acknowledgeAlert)
  const clearAlerts = useAlertStore((s) => s.clearAlerts)

  const [variant, setVariant] = useState<ChartVariant>('standard')
  const [patientStatus, setPatientStatus] = useState<PatientStatus>('stable')

  const mostRecentVitals = patient.vitals.length > 0 ? patient.vitals[0] : null

  const validation = useMemo(
    () => (mostRecentVitals ? validateVitalsComplete(mostRecentVitals) : null),
    [mostRecentVitals],
  )

  const qaddsScore = useMemo(
    () => (mostRecentVitals ? calculateQadds(mostRecentVitals, variant) : null),
    [mostRecentVitals, variant],
  )

  // Evaluate alerts on mount (and when the most-recent vitals change)
  useEffect(() => {
    clearAlerts()

    if (!mostRecentVitals) return

    const alerts = evaluateAlerts(mostRecentVitals, variant)
    if (alerts.length > 0) {
      addAlerts(alerts)
      // Show the highest-priority alert (first one is the most critical)
      setActiveAlert(alerts[0])
    }
  }, [mostRecentVitals, variant, addAlerts, setActiveAlert, clearAlerts])

  function handleDismissAlert() {
    if (activeAlert) {
      acknowledgeAlert(activeAlert.id)
    }
    setActiveAlert(null)
  }

  const isIncomplete = validation !== null && !validation.complete
  const missingNames = validation?.missing.map((p) => PARAMETER_DISPLAY_NAMES[p]) ?? []

  if (!mostRecentVitals) {
    return (
      <>
        <div className="content-header">Managing Deterioration - Q-ADDS</div>
        <div className="content-body">
          <div
            style={{
              fontFamily: FONT_FAMILY,
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
        {/* Top controls: Chart Variant + Patient Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '12px',
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
          }}
        >
          {/* Chart Variant Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label
              htmlFor="chart-variant-select"
              style={{ fontWeight: 600, color: 'var(--cerner-dark-blue, #004578)' }}
            >
              Chart Variant:
            </label>
            <select
              id="chart-variant-select"
              value={variant}
              onChange={(e) => setVariant(e.target.value as ChartVariant)}
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: '11px',
                padding: '3px 6px',
                border: '1px solid var(--cerner-border, #ccc)',
                borderRadius: '3px',
                backgroundColor: '#ffffff',
                color: '#333333',
              }}
            >
              <option value="standard">Standard (General Adult)</option>
              <option value="chronic_respiratory">Chronic Hypoxia / Hypercapnia Respiratory</option>
            </select>
          </div>

          {/* Patient Status Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 600, color: 'var(--cerner-dark-blue, #004578)' }}>
              Patient Status:
            </span>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="patient-status"
                value="stable"
                checked={patientStatus === 'stable'}
                onChange={() => setPatientStatus('stable')}
              />
              <span style={{ color: '#333333' }}>Stable / Improving</span>
            </label>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="patient-status"
                value="deteriorating"
                checked={patientStatus === 'deteriorating'}
                onChange={() => setPatientStatus('deteriorating')}
              />
              <span style={{ color: '#333333' }}>Deteriorating</span>
            </label>
          </div>
        </div>

        {/* Incomplete Vitals Warning Banner */}
        {isIncomplete && (
          <div
            style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '3px',
              padding: '8px 12px',
              marginBottom: '12px',
              fontFamily: FONT_FAMILY,
              fontSize: '11px',
              color: '#856404',
              fontWeight: 600,
              lineHeight: '16px',
            }}
          >
            Incomplete vital signs — EWS cannot be calculated. Missing:{' '}
            {missingNames.join(', ')}
          </div>
        )}

        {/* Top section: Score Card + Escalation Protocol side by side */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '12px',
            opacity: isIncomplete ? 0.45 : 1,
            pointerEvents: isIncomplete ? 'none' : 'auto',
          }}
        >
          {isIncomplete && (
            <div
              style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                fontFamily: FONT_FAMILY,
                fontSize: '11px',
                color: '#856404',
                fontStyle: 'italic',
                marginBottom: '-8px',
              }}
            >
              Score card and escalation protocol unavailable until all vitals are recorded.
            </div>
          )}
          <QaddsScoreCard vitals={mostRecentVitals} variant={variant} />
          <EscalationProtocol
            risk={qaddsScore?.clinicalRisk ?? 'Routine'}
            status={patientStatus}
          />
        </div>

        {/* Middle section: Vital Signs Flowsheet */}
        <div style={{ marginBottom: '12px' }}>
          <VitalSignsFlowsheet vitals={patient.vitals} variant={variant} />
        </div>

        {/* Bottom section: Score Trend Graph */}
        <div style={{ marginBottom: '12px' }}>
          <ScoreTrendGraph vitals={patient.vitals} variant={variant} />
        </div>
      </div>

      {/* Alert Dialog overlay (renders only when activeAlert is set) */}
      {activeAlert && (
        <AlertDialog alert={activeAlert} onDismiss={handleDismissAlert} />
      )}
    </>
  )
}
