/**
 * @file newsCalculator.ts
 * @description NEWS2 (National Early Warning Score 2) calculation service.
 *
 * Implements the Royal College of Physicians NEWS2 scoring algorithm.
 * Given a set of vital sign observations, the service computes individual
 * sub-scores for each physiological parameter, sums them to an aggregate
 * score, and derives the clinical risk level with an escalation
 * recommendation.
 *
 * @see https://www.rcplondon.ac.uk/projects/outputs/national-early-warning-score-news-2
 */

import type { VitalSign } from '../types/patient';
import type {
  NEWS2Result,
  NEWS2SubScore,
  ClinicalRisk,
  EscalationLevel,
  ScoreThresholdBand,
} from '../types/news';
import {
  NEWS2_THRESHOLDS,
  AVPU_NUMERIC_MAP,
  CLINICAL_RISK_THRESHOLDS,
} from '../types/news';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the full NEWS2 result for a single vital sign observation.
 *
 * @param vital - A vital sign observation set.
 * @returns Complete NEWS2 result with sub-scores, total, risk, and escalation.
 *
 * @example
 * ```ts
 * const result = calculateNEWS2({
 *   datetime: '2026-02-17T08:00:00',
 *   temp: 38.5,
 *   hr: 112,
 *   rr: 22,
 *   bp_sys: 105,
 *   spo2: 94,
 *   avpu: 'A',
 *   supplementalO2: false,
 * });
 * // result.totalScore → 7, result.clinicalRisk → 'High'
 * ```
 */
export function calculateNEWS2(vital: VitalSign): NEWS2Result {
  const subScores: NEWS2SubScore[] = [];

  // Respiratory Rate
  if (vital.rr != null) {
    const score = calculateSubScore('respiratoryRate', vital.rr);
    subScores.push({ parameter: 'Respiratory Rate', value: vital.rr, score });
  }

  // SpO2 — use Scale 1 by default; Scale 2 only for patients on supplemental O2
  // with target range 88-92 (not modelled here, so we use Scale 1 as standard).
  if (vital.spo2 != null) {
    const score = calculateSubScore('spo2Scale1', vital.spo2);
    subScores.push({ parameter: 'SpO2', value: vital.spo2, score });
  }

  // Supplemental oxygen
  {
    const numericValue = vital.supplementalO2 ? 1 : 0;
    const score = calculateSubScore('supplementalO2', numericValue);
    subScores.push({
      parameter: 'Supplemental O2',
      value: vital.supplementalO2 ? 'Yes' : 'No',
      score,
    });
  }

  // Temperature
  if (vital.temp != null) {
    const score = calculateSubScore('temperature', vital.temp);
    subScores.push({ parameter: 'Temperature', value: vital.temp, score });
  }

  // Systolic blood pressure
  if (vital.bp_sys != null) {
    const score = calculateSubScore('systolicBP', vital.bp_sys);
    subScores.push({ parameter: 'Systolic BP', value: vital.bp_sys, score });
  }

  // Heart rate
  if (vital.hr != null) {
    const score = calculateSubScore('heartRate', vital.hr);
    subScores.push({ parameter: 'Heart Rate', value: vital.hr, score });
  }

  // Consciousness (AVPU)
  if (vital.avpu != null) {
    const avpuNumeric = AVPU_NUMERIC_MAP[vital.avpu] ?? 0;
    const score = calculateSubScore('consciousness', avpuNumeric);
    subScores.push({ parameter: 'Consciousness', value: vital.avpu, score });
  }

  // Aggregate
  const totalScore = subScores.reduce((sum, s) => sum + s.score, 0);
  const hasRedScore = subScores.some((s) => s.score === 3);
  const clinicalRisk = getClinicalRisk(totalScore, hasRedScore);
  const escalationLevel = getEscalationLevel(clinicalRisk);

  return {
    totalScore,
    subScores,
    clinicalRisk,
    escalationLevel,
  };
}

/**
 * Calculate the sub-score for a single physiological parameter.
 *
 * Looks up the parameter's threshold bands from {@link NEWS2_THRESHOLDS}
 * and returns the score whose range the value falls within.
 *
 * @param parameter       - Key into NEWS2_THRESHOLDS (e.g. 'respiratoryRate').
 * @param value           - The observed numeric value.
 * @param _supplementalO2 - Reserved for future Scale 2 logic.
 * @returns The sub-score (0, 1, 2, or 3). Returns 0 if the parameter is unknown.
 */
export function calculateSubScore(
  parameter: string,
  value: number,
  _supplementalO2?: boolean,
): 0 | 1 | 2 | 3 {
  const thresholds = NEWS2_THRESHOLDS[parameter];
  if (!thresholds) return 0;

  const band = thresholds.bands.find(
    (b: ScoreThresholdBand) => value >= b.min && value <= b.max,
  );

  return band?.score ?? 0;
}

/**
 * Derive the clinical risk category from the aggregate NEWS2 score.
 *
 * Implements the standard NEWS2 risk stratification:
 * - **High**: aggregate ≥ 7
 * - **Medium**: aggregate 5–6 (or any single param = 3 with aggregate ≥ 5)
 * - **Low-Medium**: aggregate 0–4 but any single parameter scores 3
 * - **Low**: aggregate 0–4 with no individual score of 3
 *
 * @param totalScore  - Aggregate NEWS2 score.
 * @param hasRedScore - Whether any individual parameter scored 3.
 * @returns The clinical risk classification.
 */
export function getClinicalRisk(
  totalScore: number,
  hasRedScore: boolean = false,
): ClinicalRisk {
  if (totalScore >= CLINICAL_RISK_THRESHOLDS.high) {
    return 'High';
  }
  if (totalScore >= CLINICAL_RISK_THRESHOLDS.medium) {
    return 'Medium';
  }
  if (hasRedScore) {
    return 'Low-Medium';
  }
  return 'Low';
}

/**
 * Map a clinical risk level to a recommended escalation response.
 *
 * | Risk        | Level | Action                                       |
 * |-------------|-------|----------------------------------------------|
 * | Low         | 0     | Continue routine monitoring                  |
 * | Low-Medium  | 1     | Increase observation frequency                |
 * | Medium      | 2     | Urgent clinical review by ward team           |
 * | High        | 3     | Emergency response – critical care outreach   |
 *
 * @param risk - The clinical risk category.
 * @returns Human-readable escalation recommendation string.
 */
export function getEscalationRecommendation(risk: ClinicalRisk): string {
  switch (risk) {
    case 'Low':
      return 'Continue routine monitoring (minimum 12-hourly observations)';
    case 'Low-Medium':
      return 'Increase observation frequency to minimum 1-hourly. Inform registered nurse who must assess the patient. Registered nurse to decide if increased frequency of monitoring and/or escalation of clinical care is required.';
    case 'Medium':
      return 'Urgent clinical review by ward-based doctor or acute team nurse. Consider whether escalation of care to team with critical-care skills is needed (e.g. critical care outreach team).';
    case 'High':
      return 'Emergency response. Immediate assessment by clinical team or critical care outreach team. Usually transfer to higher level of care (e.g. ICU/HDU). Clinical review every 30 minutes.';
    default:
      return 'Unknown risk level';
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Map a ClinicalRisk to the numeric EscalationLevel.
 *
 * @param risk - Clinical risk classification.
 * @returns Numeric escalation level (0–3).
 */
function getEscalationLevel(risk: ClinicalRisk): EscalationLevel {
  switch (risk) {
    case 'Low':
      return 0;
    case 'Low-Medium':
      return 1;
    case 'Medium':
      return 2;
    case 'High':
      return 3;
    default:
      return 0;
  }
}
