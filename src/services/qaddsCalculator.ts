/**
 * Q-ADDS (Queensland Adult Deterioration Detection System) Score Calculator.
 *
 * Implements the Q-ADDS v2 scoring algorithm used across Queensland Health
 * facilities. Each of 7 physiological parameters is scored 0–3 or "E"
 * (Emergency). An "E" on any single parameter triggers an immediate MET call.
 *
 * Thresholds compiled from published academic sources:
 * - Flenady et al. (2023) Collegian
 * - Flenady et al. (2020) Resuscitation
 * - ADDS Chart Development Report (ACSQHC)
 * - QAS Adult Deterioration Assessment CPP
 */

import type { VitalSign } from '@/types/patient'
import type {
  QaddsParameter,
  QaddsSubScoreValue,
  QaddsSubScore,
  QaddsSubScores,
  QaddsScore,
  QaddsScoreTrend,
  ClinicalRisk,
} from '@/types/vitals'
import type { QaddsColorCode } from '@/types/news'

// ---------------------------------------------------------------------------
// Threshold Tables
// ---------------------------------------------------------------------------

interface ThresholdBand {
  min: number
  max: number
  score: QaddsSubScoreValue
}

const RR_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 4, score: 'E' },
  { min: 5, max: 9, score: 3 },
  { min: 10, max: 19, score: 0 },
  { min: 20, max: 24, score: 1 },
  { min: 25, max: 29, score: 2 },
  { min: 30, max: 35, score: 3 },
  { min: 36, max: Infinity, score: 'E' },
]

const SPO2_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 84, score: 'E' },
  { min: 85, max: 89, score: 3 },
  { min: 90, max: 94, score: 2 },
  { min: 95, max: 97, score: 1 },
  { min: 98, max: Infinity, score: 0 },
]

const O2_FLOW_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 0, score: 0 }, // room air
  { min: 0.1, max: 4, score: 1 },
  { min: 4.1, max: 10, score: 2 },
  { min: 10.1, max: 15, score: 3 },
  { min: 15.1, max: Infinity, score: 'E' },
]

const SBP_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 79, score: 'E' },
  { min: 80, max: 89, score: 3 },
  { min: 90, max: 99, score: 2 },
  { min: 100, max: 109, score: 1 },
  { min: 110, max: 219, score: 0 },
  { min: 220, max: Infinity, score: 3 },
]

const HR_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 30, score: 'E' },
  { min: 31, max: 40, score: 3 },
  { min: 41, max: 50, score: 2 },
  { min: 51, max: 100, score: 0 },
  { min: 101, max: 110, score: 1 },
  { min: 111, max: 129, score: 2 },
  { min: 130, max: 139, score: 3 },
  { min: 140, max: Infinity, score: 'E' },
]

const TEMP_THRESHOLDS: ThresholdBand[] = [
  { min: -Infinity, max: 35.0, score: 3 },
  { min: 35.1, max: 35.4, score: 2 },
  { min: 35.5, max: 35.9, score: 1 },
  { min: 36.0, max: 37.9, score: 0 },
  { min: 38.0, max: 38.4, score: 1 },
  { min: 38.5, max: 39.0, score: 2 },
  { min: 39.1, max: Infinity, score: 3 },
]

/** AVPU consciousness scoring. "Unresponsive" is an E-trigger. */
const CONSCIOUSNESS_MAP: Record<string, QaddsSubScoreValue> = {
  Alert: 0,
  A: 0,
  Voice: 1,
  V: 1,
  Pain: 2,
  P: 2,
  Unresponsive: 'E',
  U: 'E',
}

const THRESHOLD_MAP: Record<string, ThresholdBand[]> = {
  rr: RR_THRESHOLDS,
  spo2: SPO2_THRESHOLDS,
  o2FlowRate: O2_FLOW_THRESHOLDS,
  systolicBP: SBP_THRESHOLDS,
  heartRate: HR_THRESHOLDS,
  temperature: TEMP_THRESHOLDS,
}

// ---------------------------------------------------------------------------
// Scoring Functions
// ---------------------------------------------------------------------------

function lookupScore(thresholds: ThresholdBand[], value: number): QaddsSubScoreValue {
  for (const band of thresholds) {
    if (value >= band.min && value <= band.max) {
      return band.score
    }
  }
  return 3 // fallback for values outside any defined band
}

function scoreNumericParam(
  parameter: QaddsParameter,
  rawValue: string | number | undefined,
): QaddsSubScore {
  const numVal = typeof rawValue === 'string' ? parseFloat(rawValue) : (rawValue ?? 0)
  const thresholds = THRESHOLD_MAP[parameter]
  if (!thresholds) {
    return { parameter, value: numVal, score: 0 }
  }
  return { parameter, value: numVal, score: lookupScore(thresholds, numVal) }
}

function scoreConsciousness(avpu: string | undefined): QaddsSubScore {
  const normalised = (avpu ?? 'Alert').trim()
  const score = CONSCIOUSNESS_MAP[normalised] ?? 0
  return { parameter: 'consciousness', value: normalised, score }
}

/**
 * Derive the clinical risk level from the aggregate score and emergency flags.
 */
function deriveRisk(totalScore: number, hasEmergency: boolean): ClinicalRisk {
  if (hasEmergency || totalScore >= 8) return 'Emergency'
  if (totalScore >= 6) return 'High'
  if (totalScore >= 4) return 'Moderate'
  if (totalScore >= 1) return 'Low'
  return 'Routine'
}

/** Convert a sub-score value to its numeric equivalent for aggregation. */
function numericScore(s: QaddsSubScoreValue): number {
  return s === 'E' ? 3 : s
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the full Q-ADDS score for a single set of vital sign observations.
 */
export function calculateQadds(vitals: VitalSign): QaddsScore {
  const rr = scoreNumericParam('rr', vitals.rr)
  const spo2 = scoreNumericParam('spo2', vitals.spo2)
  const o2FlowRate = scoreNumericParam('o2FlowRate', vitals.o2FlowRate)
  const systolicBP = scoreNumericParam('systolicBP', vitals.bp_sys)
  const heartRate = scoreNumericParam('heartRate', vitals.hr)
  const temperature = scoreNumericParam('temperature', vitals.temp)
  const consciousness = scoreConsciousness(vitals.avpu)

  const subScores: QaddsSubScores = {
    rr,
    spo2,
    o2FlowRate,
    systolicBP,
    heartRate,
    temperature,
    consciousness,
  }

  const allScores = Object.values(subScores)
  const emergencyParameters = allScores
    .filter((s) => s.score === 'E')
    .map((s) => s.parameter)

  const hasEmergency = emergencyParameters.length > 0 || vitals.nurseConcern === true

  const totalScore = allScores.reduce((sum, s) => sum + numericScore(s.score), 0)
  const clinicalRisk = deriveRisk(totalScore, hasEmergency)

  return {
    totalScore,
    hasEmergency,
    emergencyParameters,
    clinicalRisk,
    subScores,
  }
}

/**
 * Calculate Q-ADDS scores for an array of vitals, returning trend data
 * suitable for plotting score over time.
 */
export function calculateQaddsTrend(vitals: VitalSign[]): QaddsScoreTrend[] {
  return vitals.map((v) => ({
    datetime: v.datetime,
    score: calculateQadds(v),
  }))
}

/**
 * Get the CSS colour for a given Q-ADDS sub-score value.
 */
export function getScoreColor(score: QaddsSubScoreValue): QaddsColorCode {
  switch (score) {
    case 0:
      return 'white'
    case 1:
      return 'yellow'
    case 2:
      return 'orange'
    case 3:
      return 'red'
    case 'E':
      return 'purple'
  }
}

/**
 * Get the CSS colour for a clinical risk level.
 */
export function getRiskColor(risk: ClinicalRisk): string {
  switch (risk) {
    case 'Routine':
      return '#ffffff'
    case 'Low':
      return '#fff3cd'
    case 'Moderate':
      return '#ffd699'
    case 'High':
      return '#f8d7da'
    case 'Emergency':
      return '#d5a6e6'
  }
}

/**
 * Get the hex background colour for a Q-ADDS colour code.
 */
export function getColorHex(color: QaddsColorCode): string {
  switch (color) {
    case 'white':
      return '#ffffff'
    case 'yellow':
      return '#fff3cd'
    case 'orange':
      return '#ffd699'
    case 'red':
      return '#f8d7da'
    case 'purple':
      return '#d5a6e6'
  }
}

/**
 * Get the escalation instruction text for a clinical risk level.
 */
export function getEscalationText(risk: ClinicalRisk): string {
  switch (risk) {
    case 'Routine':
      return 'Continue routine observations as ordered.'
    case 'Low':
      return 'Increase observation frequency. Charge nurse to review patient.'
    case 'Moderate':
      return 'Medical officer review required. Increase observation frequency to minimum 2-hourly.'
    case 'High':
      return 'Urgent senior clinician review. Consider Rapid Response call. Minimum hourly observations.'
    case 'Emergency':
      return 'ACTIVATE MET CALL IMMEDIATELY. Commence emergency assessment and management.'
  }
}
