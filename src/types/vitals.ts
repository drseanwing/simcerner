/**
 * Q-ADDS (Queensland Adult Deterioration Detection System) scoring types.
 *
 * Q-ADDS monitors 7 physiological parameters. Each receives a sub-score of
 * 0–4, or "E" (Emergency) for extreme derangement. An "E" on any single
 * parameter triggers an immediate MET (Medical Emergency Team) call,
 * regardless of the aggregate score.
 *
 * Escalation tiers (by aggregate score):
 *   0       → Routine care (white)
 *   1–3     → Low-level response — increase observation frequency (yellow)
 *   4–5     → Moderate — medical officer review required (orange)
 *   6–7     → High-severity — senior clinician review (red)
 *   ≥8 or E → Emergency — MET call activation (purple)
 */

// ---------------------------------------------------------------------------
// Clinical Risk Levels
// ---------------------------------------------------------------------------

/**
 * Q-ADDS clinical risk classification.
 *
 * - 'Routine'   : Score 0 — continue routine observations
 * - 'Low'       : Score 1–3 — increase observation frequency, charge nurse review
 * - 'Moderate'  : Score 4–5 — medical officer review required
 * - 'High'      : Score 6–7 — senior clinician review
 * - 'Emergency' : Score ≥8 or any single "E" — MET call
 */
export type ClinicalRisk = 'Routine' | 'Low' | 'Moderate' | 'High' | 'Emergency';

// ---------------------------------------------------------------------------
// Sub-Scores
// ---------------------------------------------------------------------------

/**
 * Q-ADDS scored parameters. Includes o2FlowRate which is unique to Q-ADDS
 * (NEWS2 uses a binary supplementalO2 flag instead).
 */
export type QaddsParameter =
  | 'rr'
  | 'spo2'
  | 'o2FlowRate'
  | 'temperature'
  | 'systolicBP'
  | 'heartRate'
  | 'consciousness';

/**
 * Sub-score values. 0–4 are standard; 'E' is the emergency single-parameter
 * trigger unique to Q-ADDS. Score 4 indicates severe derangement just below
 * the emergency threshold.
 */
export type QaddsSubScoreValue = 0 | 1 | 2 | 3 | 4 | 'E';

/**
 * A sub-score for a single Q-ADDS parameter.
 */
export interface QaddsSubScore {
  parameter: QaddsParameter;
  value: string | number;
  score: QaddsSubScoreValue;
}

// ---------------------------------------------------------------------------
// Aggregate Q-ADDS Score
// ---------------------------------------------------------------------------

export type QaddsSubScores = Record<QaddsParameter, QaddsSubScore>;

/**
 * Complete Q-ADDS score for a single set of vital sign observations.
 */
export interface QaddsScore {
  /** Sum of numeric sub-scores (E counts as 4 for the total) */
  totalScore: number;
  /** Whether any parameter scored "E" (triggers MET regardless of total) */
  hasEmergency: boolean;
  /** Which parameters scored "E", if any */
  emergencyParameters: QaddsParameter[];
  /** Derived clinical risk level */
  clinicalRisk: ClinicalRisk;
  /** Individual sub-scores for each parameter */
  subScores: QaddsSubScores;
}

/**
 * Q-ADDS score paired with its observation timestamp for trend plotting.
 */
export interface QaddsScoreTrend {
  datetime: string;
  score: QaddsScore;
}

// ---------------------------------------------------------------------------
// Chart Variants & Patient Status
// ---------------------------------------------------------------------------

/**
 * Q-ADDS observation chart variant.
 *
 * - 'standard'             : General adult chart (default)
 * - 'chronic_respiratory'  : Chronic hypoxia/hypercapnia chart with adjusted
 *                            SpO₂ thresholds
 */
export type ChartVariant = 'standard' | 'chronic_respiratory';

/**
 * Patient clinical status used for escalation pathway differentiation.
 *
 * - 'deteriorating' : Patient condition is worsening (score trending up)
 * - 'stable'        : Patient condition is stable or improving
 */
export type PatientStatus = 'deteriorating' | 'stable';
