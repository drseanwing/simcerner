/**
 * Deterioration Alert Engine.
 *
 * Monitors Q-ADDS scores and generates clinical alerts based on the
 * Queensland Health escalation protocol. Alert severity tiers:
 *
 *   - Any parameter scored "E"  → MET CALL REQUIRED (emergency parameters)
 *   - Aggregate score ≥ 8       → MET CALL REQUIRED — Aggregate Score ≥8
 *   - Aggregate score ≥ 6       → Urgent Clinical Review Required
 *   - Aggregate score ≥ 4       → Medical Officer Review Required
 *   - Staff concern flag        → Staff Member Concern — Clinical Review Required
 */

import type { VitalSign } from '@/types/patient'
import type { ClinicalRisk } from '@/types/vitals'
import { calculateQadds } from '@/services/qaddsCalculator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AlertData {
  /** Unique alert identifier */
  id: string
  /** Short alert title displayed in the alert banner */
  title: string
  /** Descriptive message with clinical context */
  message: string
  /** Clinical risk level associated with this alert */
  risk: ClinicalRisk
  /** Parameter names that triggered the alert */
  parameters: string[]
  /** Timestamp (epoch ms) when the alert was generated */
  timestamp: number
  /** Whether the alert has been acknowledged by the user */
  acknowledged: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let alertCounter = 0

function createAlertId(): string {
  alertCounter += 1
  return `alert-${Date.now()}-${alertCounter}`
}

/** Human-readable label for a Q-ADDS parameter key. */
function parameterLabel(param: string): string {
  const labels: Record<string, string> = {
    rr: 'Respiratory Rate',
    spo2: 'SpO2',
    o2FlowRate: 'O2 Flow Rate',
    systolicBP: 'Systolic BP',
    heartRate: 'Heart Rate',
    temperature: 'Temperature',
    consciousness: 'Consciousness (AVPU)',
  }
  return labels[param] ?? param
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate a single set of vital sign observations and return any alerts
 * that should be raised according to the Q-ADDS escalation protocol.
 *
 * Multiple alerts can be generated simultaneously (e.g. an E-trigger alert
 * *and* a high-aggregate-score alert).
 */
export function evaluateAlerts(vitals: VitalSign): AlertData[] {
  const score = calculateQadds(vitals)
  const alerts: AlertData[] = []
  const now = Date.now()

  // --- E-trigger: any single parameter scored "E" -------------------------
  if (score.emergencyParameters.length > 0) {
    const paramLabels = score.emergencyParameters.map(parameterLabel)
    alerts.push({
      id: createAlertId(),
      title: 'MET CALL REQUIRED',
      message: `Emergency parameter trigger detected: ${paramLabels.join(', ')}. Activate MET call immediately.`,
      risk: 'Emergency',
      parameters: score.emergencyParameters,
      timestamp: now,
      acknowledged: false,
    })
  }

  // --- Aggregate score ≥ 8 ------------------------------------------------
  if (score.totalScore >= 8) {
    alerts.push({
      id: createAlertId(),
      title: 'MET CALL REQUIRED \u2014 Aggregate Score \u22658',
      message: `Q-ADDS aggregate score is ${score.totalScore}. Activate MET call immediately.`,
      risk: 'Emergency',
      parameters: [],
      timestamp: now,
      acknowledged: false,
    })
  }

  // --- Aggregate score ≥ 6 (but < 8, to avoid duplicate) -----------------
  if (score.totalScore >= 6 && score.totalScore < 8) {
    alerts.push({
      id: createAlertId(),
      title: 'Urgent Clinical Review Required',
      message: `Q-ADDS aggregate score is ${score.totalScore}. Senior clinician review and consider Rapid Response call.`,
      risk: 'High',
      parameters: [],
      timestamp: now,
      acknowledged: false,
    })
  }

  // --- Aggregate score ≥ 4 (but < 6, to avoid duplicate) -----------------
  if (score.totalScore >= 4 && score.totalScore < 6) {
    alerts.push({
      id: createAlertId(),
      title: 'Medical Officer Review Required',
      message: `Q-ADDS aggregate score is ${score.totalScore}. Medical officer review required. Increase observation frequency to minimum 2-hourly.`,
      risk: 'Moderate',
      parameters: [],
      timestamp: now,
      acknowledged: false,
    })
  }

  // --- Staff/nurse concern ------------------------------------------------
  if (vitals.nurseConcern === true) {
    alerts.push({
      id: createAlertId(),
      title: 'Staff Member Concern \u2014 Clinical Review Required',
      message: 'A staff member has raised a clinical concern about this patient. Clinical review required regardless of Q-ADDS score.',
      risk: 'High',
      parameters: [],
      timestamp: now,
      acknowledged: false,
    })
  }

  return alerts
}
