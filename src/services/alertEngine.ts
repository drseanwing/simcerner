/**
 * Deterioration Alert Engine.
 *
 * Monitors Q-ADDS scores and generates clinical alerts based on the
 * Queensland Health Discern Alert system. Alert content varies by EWS range:
 *
 *   - EW Score 1-3   : Low-level response (yellow)
 *   - EW Score 4-5   : Medical officer review (orange)
 *   - EW Score 6-7   : Senior clinician review (red)
 *   - EW Score >=8   : MET Call Criteria Met (purple)
 *   - E zone trigger : MET Call Criteria Met (purple)
 *   - Nurse concern  : Staff concern escalation
 *
 * Each alert includes deteriorating/stable actions, deteriorating criteria,
 * and an optional sepsis screening prompt per Queensland Health protocol.
 */

import type { VitalSign } from '@/types/patient'
import type { ChartVariant, ClinicalRisk, QaddsParameter } from '@/types/vitals'
import { calculateQadds } from '@/services/qaddsCalculator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AlertData {
  /** Unique alert identifier */
  id: string
  /** Short alert title, e.g. "EW Score 4-5" or "MET Call Criteria Met" */
  title: string
  /** Bold instruction line shown at the top of the alert body */
  message: string
  /** Clinical risk level associated with this alert */
  risk: ClinicalRisk
  /** Parameter names that triggered the alert (for E-zone alerts) */
  parameters: string[]
  /** Timestamp (epoch ms) when the alert was generated */
  timestamp: number
  /** Whether the alert has been acknowledged by the user */
  acknowledged: boolean
  /** EWS range that triggered this alert */
  ewsRange: '1-3' | '4-5' | '6-7' | '>=8' | 'E' | 'nurse-concern'
  /** Actions to take if patient is deteriorating */
  deterioratingActions: string
  /** Actions to take if patient is stable/improving */
  stableActions: string
  /** The 3 deterioration criteria for classifying patient as deteriorating */
  deterioratingCriteria: string[]
  /** Whether to show the sepsis screening prompt */
  showSepsisPrompt: boolean
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
function parameterLabel(param: QaddsParameter): string {
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

/**
 * Check whether any sepsis screening criterion is met.
 *
 * Criteria:
 * - RR >= 25
 * - HR >= 130
 * - SBP < 90
 * - Temperature < 35.5 or > 38.4
 * - SpO2 requires new O2 to stay > 91%
 */
function checkSepsisCriteria(vitals: VitalSign): boolean {
  const rr = parseFloat(vitals.rr)
  const hr = parseFloat(vitals.hr)
  const sbp = parseFloat(vitals.bp_sys)
  const temp = parseFloat(vitals.temp)
  const spo2 = parseFloat(vitals.spo2)

  if (!isNaN(rr) && rr >= 25) return true
  if (!isNaN(hr) && hr >= 130) return true
  if (!isNaN(sbp) && sbp < 90) return true
  if (!isNaN(temp) && (temp < 35.5 || temp > 38.4)) return true

  // SpO2 requires new supplemental O2 to stay above 91%
  const hasSupplementalO2 =
    vitals.supplementalO2 === true || vitals.supplementalO2 === 'true'
  if (!isNaN(spo2) && spo2 <= 91 && hasSupplementalO2) return true

  return false
}

/** Deterioration criteria for EWS >= 8 (aggregate score trigger). */
const SCORE_DETERIORATING_CRITERIA: string[] = [
  'Concern patient is worse or not improving',
  'NEW contributing vital sign(s)',
  'Score higher than last score',
]

/** Deterioration criteria for E-zone triggers. */
const E_ZONE_DETERIORATING_CRITERIA: string[] = [
  'Concern patient is worse or not improving',
  'Any vital sign(s) worse',
  'E zone vital sign outside accepted range',
]

/** Default deterioration criteria (used for EWS 1-3, 4-5, 6-7). */
const DEFAULT_DETERIORATING_CRITERIA: string[] = [
  'Concern patient is worse or not improving',
  'NEW contributing vital sign(s)',
  'Score higher than last score',
]

// ---------------------------------------------------------------------------
// Alert Content by EWS Range
// ---------------------------------------------------------------------------

interface EwsRangeContent {
  title: string
  risk: ClinicalRisk
  deterioratingActions: string
  stableActions: string
}

const EWS_RANGE_CONTENT: Record<string, EwsRangeContent> = {
  '1-3': {
    title: 'EW Score 1-3',
    risk: 'Low',
    deterioratingActions:
      'Notify Team Leader. Nurse escort for transfers. 1 hourly observations.',
    stableActions:
      '4th hourly observations (minimum). May be modified by SMO.',
  },
  '4-5': {
    title: 'EW Score 4-5',
    risk: 'Moderate',
    deterioratingActions:
      'Notify Team Leader. Notify RMO to review within 30 minutes. 1 hourly observations. Nurse escort for transfers. If no review after 30 min \u2192 call Registrar.',
    stableActions:
      '2nd hourly observations (minimum). May be modified by SMO.',
  },
  '6-7': {
    title: 'EW Score 6-7',
    risk: 'High',
    deterioratingActions:
      'Notify Team Leader. Notify Registrar to review within 30 minutes. \u00BD hourly observations. Nurse escort for transfers. If no review after 30 min \u2192 call MET or escalate to SMO.',
    stableActions:
      '1 hourly observations (minimum). May be modified by SMO.',
  },
  '>=8': {
    title: 'MET Call Criteria Met',
    risk: 'Emergency',
    deterioratingActions:
      'Initiate MET call. 10 minutely observations. Registrar to ensure Consultant notified. Registrar and Nurse escort for transfers.',
    stableActions: '\u00BD hourly observations (minimum).',
  },
  E: {
    title: 'MET Call Criteria Met',
    risk: 'Emergency',
    deterioratingActions:
      'Initiate MET call. 10 minutely observations. Registrar to ensure Consultant notified. Registrar and Nurse escort for transfers.',
    stableActions: '\u00BD hourly observations (minimum).',
  },
}

/** Standard instruction message for all Discern Alerts. */
const ALERT_INSTRUCTION =
  'Do not close: Go to Managing Deterioration graph page to review vital signs'

/** Additional instruction for EW Score 4-5. */
const ADDITIONAL_CRITERIA_INSTRUCTION =
  'Select Additional Criteria button on Managing Deterioration page for required escalation and observation actions'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Evaluate a single set of vital sign observations and return any alerts
 * that should be raised according to the Queensland Health Discern Alert
 * system.
 *
 * Alert priority (highest first):
 *   E-trigger -> Score >= 8 -> Score 6-7 -> Score 4-5 -> Score 1-3 -> Nurse concern
 *
 * Multiple alerts can be generated simultaneously (e.g. an E-trigger alert
 * *and* a nurse concern alert).
 */
export function evaluateAlerts(
  vitals: VitalSign,
  variant?: ChartVariant,
): AlertData[] {
  const score = calculateQadds(vitals, variant)
  const alerts: AlertData[] = []
  const now = Date.now()
  const sepsisPrompt = checkSepsisCriteria(vitals)

  const hasEmergencyParams = score.emergencyParameters.length > 0

  // --- E-trigger: any single parameter scored "E" -------------------------
  if (hasEmergencyParams) {
    const paramLabels = score.emergencyParameters.map(parameterLabel)
    const content = EWS_RANGE_CONTENT['E']
    alerts.push({
      id: createAlertId(),
      title: content.title,
      message: ALERT_INSTRUCTION,
      risk: content.risk,
      parameters: paramLabels,
      timestamp: now,
      acknowledged: false,
      ewsRange: 'E',
      deterioratingActions: content.deterioratingActions,
      stableActions: content.stableActions,
      deterioratingCriteria: E_ZONE_DETERIORATING_CRITERIA,
      showSepsisPrompt: sepsisPrompt,
    })
  }

  // --- Aggregate score >= 8 (only if NOT already an E-trigger) -----------
  if (score.totalScore >= 8 && !hasEmergencyParams) {
    const content = EWS_RANGE_CONTENT['>=8']
    alerts.push({
      id: createAlertId(),
      title: content.title,
      message: ALERT_INSTRUCTION,
      risk: content.risk,
      parameters: [],
      timestamp: now,
      acknowledged: false,
      ewsRange: '>=8',
      deterioratingActions: content.deterioratingActions,
      stableActions: content.stableActions,
      deterioratingCriteria: SCORE_DETERIORATING_CRITERIA,
      showSepsisPrompt: sepsisPrompt,
    })
  }

  // --- Aggregate score 6-7 -----------------------------------------------
  if (score.totalScore >= 6 && score.totalScore <= 7 && !hasEmergencyParams) {
    const content = EWS_RANGE_CONTENT['6-7']
    alerts.push({
      id: createAlertId(),
      title: content.title,
      message: ALERT_INSTRUCTION,
      risk: content.risk,
      parameters: [],
      timestamp: now,
      acknowledged: false,
      ewsRange: '6-7',
      deterioratingActions: content.deterioratingActions,
      stableActions: content.stableActions,
      deterioratingCriteria: DEFAULT_DETERIORATING_CRITERIA,
      showSepsisPrompt: sepsisPrompt,
    })
  }

  // --- Aggregate score 4-5 -----------------------------------------------
  if (score.totalScore >= 4 && score.totalScore <= 5 && !hasEmergencyParams) {
    const content = EWS_RANGE_CONTENT['4-5']
    const message = `${ALERT_INSTRUCTION}\n\n${ADDITIONAL_CRITERIA_INSTRUCTION}`
    alerts.push({
      id: createAlertId(),
      title: content.title,
      message,
      risk: content.risk,
      parameters: [],
      timestamp: now,
      acknowledged: false,
      ewsRange: '4-5',
      deterioratingActions: content.deterioratingActions,
      stableActions: content.stableActions,
      deterioratingCriteria: DEFAULT_DETERIORATING_CRITERIA,
      showSepsisPrompt: sepsisPrompt,
    })
  }

  // --- Aggregate score 1-3 -----------------------------------------------
  if (
    score.totalScore >= 1 &&
    score.totalScore <= 3 &&
    !hasEmergencyParams
  ) {
    const content = EWS_RANGE_CONTENT['1-3']
    alerts.push({
      id: createAlertId(),
      title: content.title,
      message: ALERT_INSTRUCTION,
      risk: content.risk,
      parameters: [],
      timestamp: now,
      acknowledged: false,
      ewsRange: '1-3',
      deterioratingActions: content.deterioratingActions,
      stableActions: content.stableActions,
      deterioratingCriteria: DEFAULT_DETERIORATING_CRITERIA,
      showSepsisPrompt: sepsisPrompt,
    })
  }

  // --- Staff/nurse concern ------------------------------------------------
  if (vitals.nurseConcern === true) {
    alerts.push({
      id: createAlertId(),
      title: 'Staff Member Concern \u2014 Clinical Review Required',
      message: ALERT_INSTRUCTION,
      risk: 'High',
      parameters: [],
      timestamp: now,
      acknowledged: false,
      ewsRange: 'nurse-concern',
      deterioratingActions:
        'Notify Team Leader. Clinical review required regardless of Q-ADDS score.',
      stableActions: 'Continue observations as ordered. Document concern.',
      deterioratingCriteria: DEFAULT_DETERIORATING_CRITERIA,
      showSepsisPrompt: sepsisPrompt,
    })
  }

  return alerts
}
