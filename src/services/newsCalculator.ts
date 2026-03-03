/**
 * @file newsCalculator.ts
 * @description Q-ADDS (Queensland Adult Deterioration Detection System) scoring engine.
 *
 * Implements the Queensland Health Q-ADDS scoring algorithm (SW150 General Adult variant).
 * Given a set of vital sign observations, the service computes individual sub-scores
 * for each of the 7 physiological parameters, sums the numeric scores to an aggregate
 * total, detects E-zone (emergency) parameters, and derives the risk level with an
 * escalation recommendation.
 *
 * @see docs/q-adds.md
 */

import type { VitalSign } from '../types/patient';
import type {
  QADDSResult,
  QADDSSubScore,
  QADDSScore,
  QADDSRiskLevel,
  EscalationLevel,
  QADDSScoreThresholdBand,
} from '../types/news';
import { QADDS_THRESHOLDS, AVPU_NUMERIC_MAP } from '../types/news';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate the full Q-ADDS result for a single vital sign observation.
 *
 * For each of the 7 parameters the matching threshold band is located,
 * the sub-score recorded, and E-zone parameters tracked.  The total score
 * is the sum of **numeric** sub-scores only (E zones contribute 0 to the
 * sum but set `hasEZone = true`).
 *
 * @param vital - A vital sign observation set.
 * @returns Complete Q-ADDS result with sub-scores, total, risk, and escalation.
 *
 * @example
 * ```ts
 * const result = calculateQADDS({
 *   datetime: '2026-02-17T08:00:00',
 *   temp: 38.5,
 *   hr: 112,
 *   rr: 22,
 *   bp_sys: 105,
 *   spo2: 94,
 *   avpu: 'A',
 *   o2FlowRate: 0,
 * });
 * // result.totalScore -> numeric sum, result.riskLevel -> 'Low' | 'Moderate' | etc.
 * ```
 */
export function calculateQADDS(vital: VitalSign): QADDSResult {
  const subScores: QADDSSubScore[] = [];
  const eZoneParameters: string[] = [];

  // --- Respiratory Rate ---
  if (vital.rr != null) {
    const rrValue = Number(vital.rr);
    const score = calculateSubScore('respiratoryRate', rrValue);
    subScores.push({ parameter: 'Respiratory Rate', value: rrValue, score });
    if (score === 'E') eZoneParameters.push('Respiratory Rate');
  }

  // --- SpO2 (Standard scale) ---
  if (vital.spo2 != null) {
    const spo2Value = Number(vital.spo2);
    const score = calculateSubScore('spo2Standard', spo2Value);
    subScores.push({ parameter: 'SpO2', value: spo2Value, score });
    if (score === 'E') eZoneParameters.push('SpO2');
  }

  // --- O2 Delivery (flow rate in L/min, default 0 = room air) ---
  {
    const o2Value = Number(vital.o2FlowRate ?? 0);
    const score = calculateSubScore('o2Delivery', o2Value);
    subScores.push({ parameter: 'O2 Delivery', value: o2Value, score });
    if (score === 'E') eZoneParameters.push('O2 Delivery');
  }

  // --- Systolic Blood Pressure ---
  if (vital.bp_sys != null) {
    const systolic = Number(vital.bp_sys);
    const score = calculateSubScore('systolicBP', systolic);
    subScores.push({ parameter: 'Systolic BP', value: systolic, score });
    if (score === 'E') eZoneParameters.push('Systolic BP');
  }

  // --- Heart Rate ---
  if (vital.hr != null) {
    const hrValue = Number(vital.hr);
    const score = calculateSubScore('heartRate', hrValue);
    subScores.push({ parameter: 'Heart Rate', value: hrValue, score });
    if (score === 'E') eZoneParameters.push('Heart Rate');
  }

  // --- Temperature ---
  if (vital.temp != null) {
    const tempValue = Number(vital.temp);
    const score = calculateSubScore('temperature', tempValue);
    subScores.push({ parameter: 'Temperature', value: tempValue, score });
    if (score === 'E') eZoneParameters.push('Temperature');
  }

  // --- Consciousness (AVPU) ---
  if (vital.avpu != null) {
    const avpuKey = String(vital.avpu);
    const avpuNumeric = AVPU_NUMERIC_MAP[avpuKey] ?? 0;
    const score = calculateSubScore('consciousness', avpuNumeric);
    subScores.push({ parameter: 'Consciousness', value: vital.avpu, score });
    if (score === 'E') eZoneParameters.push('Consciousness');
  }

  // --- Aggregate ---
  // E zones contribute 0 to the numeric sum.
  const totalScore = subScores.reduce((sum, s) => {
    return sum + (typeof s.score === 'number' ? s.score : 0);
  }, 0);

  const hasEZone = eZoneParameters.length > 0;
  const riskLevel = getQADDSRiskLevel(totalScore, hasEZone);
  const escalationLevel = getEscalationLevel(riskLevel);

  return {
    totalScore,
    subScores,
    riskLevel,
    escalationLevel,
    hasEZone,
    eZoneParameters,
  };
}

/**
 * Calculate the sub-score for a single physiological parameter.
 *
 * Looks up the parameter's threshold bands from {@link QADDS_THRESHOLDS}
 * and returns the Q-ADDS score whose range the value falls within.
 *
 * @param parameter - Key into QADDS_THRESHOLDS (e.g. 'respiratoryRate').
 * @param value     - The observed numeric value.
 * @returns The sub-score (0, 1, 2, 3, 4, or 'E'). Returns 0 if the parameter
 *          is unknown or the value does not match any band.
 */
export function calculateSubScore(
  parameter: string,
  value: number,
): QADDSScore {
  const thresholds = QADDS_THRESHOLDS[parameter];
  if (!thresholds) return 0;

  const band = thresholds.bands.find(
    (b: QADDSScoreThresholdBand) => value >= b.min && value <= b.max,
  );

  return band?.score ?? 0;
}

/**
 * Derive the Q-ADDS risk level from the aggregate score and E-zone status.
 *
 * | Condition          | Risk Level |
 * |--------------------|------------|
 * | hasEZone or >= 8   | MET        |
 * | >= 6               | High       |
 * | >= 4               | Moderate   |
 * | >= 1               | Low        |
 * | 0                  | Normal     |
 *
 * @param totalScore - Aggregate numeric Q-ADDS score.
 * @param hasEZone   - Whether any parameter fell in an E (emergency) zone.
 * @returns The Q-ADDS risk level.
 */
export function getQADDSRiskLevel(
  totalScore: number,
  hasEZone: boolean = false,
): QADDSRiskLevel {
  if (hasEZone || totalScore >= 8) return 'MET';
  if (totalScore >= 6) return 'High';
  if (totalScore >= 4) return 'Moderate';
  if (totalScore >= 1) return 'Low';
  return 'Normal';
}

/**
 * Map a Q-ADDS risk level to the numeric escalation level.
 *
 * Normal -> 0, Low -> 1, Moderate -> 2, High -> 3, MET -> 4
 *
 * @param risk - Q-ADDS risk level.
 * @returns Numeric escalation level (0-4).
 */
export function getEscalationLevel(risk: QADDSRiskLevel): EscalationLevel {
  switch (risk) {
    case 'Normal':
      return 0;
    case 'Low':
      return 1;
    case 'Moderate':
      return 2;
    case 'High':
      return 3;
    case 'MET':
      return 4;
    default:
      return 0;
  }
}

/**
 * Return the Q-ADDS escalation recommendation text for a given risk level.
 *
 * @param risk - Q-ADDS risk level.
 * @returns Human-readable escalation recommendation string.
 */
export function getEscalationRecommendation(risk: QADDSRiskLevel): string {
  switch (risk) {
    case 'Normal':
      return 'Continue routine monitoring (minimum 8-hourly observations)';
    case 'Low':
      return 'Notify Team Leader. Increase observation frequency to minimum 4-hourly (1-hourly if deteriorating). Nurse escort required for transfers.';
    case 'Moderate':
      return 'Notify Team Leader. Notify RMO to review within 30 minutes. Minimum 2-hourly observations (1-hourly if deteriorating). If no review, escalate to Registrar.';
    case 'High':
      return 'Notify Team Leader. Notify Registrar to review within 30 minutes. Minimum 1-hourly observations (half-hourly if deteriorating). If no review, initiate MET call or escalate to SMO.';
    case 'MET':
      return 'Initiate MET Call. 10-minutely observations. Registrar to ensure SMO/Consultant notified. Registrar and Nurse escort required.';
    default:
      return 'Unknown risk level';
  }
}

/**
 * Return the recommended observation frequency based on Q-ADDS risk level
 * and whether the patient is deteriorating.
 *
 * Derived from the Q-ADDS Graded Response Table (docs/q-adds.md section 5.2):
 *
 * | Score | Deteriorating | Stable/Improving |
 * |-------|---------------|------------------|
 * | 0     | -             | 8-hourly         |
 * | 1-3   | 1-hourly      | 4-hourly         |
 * | 4-5   | 1-hourly      | 2-hourly         |
 * | 6-7   | half-hourly   | 1-hourly         |
 * | >=8/E | 10-minutely   | 10-minutely      |
 *
 * @param risk            - Q-ADDS risk level.
 * @param isDeteriorating - Whether the patient meets deterioration criteria.
 * @returns Human-readable observation frequency string.
 */
export function getObservationFrequency(
  risk: QADDSRiskLevel,
  isDeteriorating: boolean = false,
): string {
  switch (risk) {
    case 'Normal':
      return '8-hourly';
    case 'Low':
      return isDeteriorating ? '1-hourly' : '4-hourly';
    case 'Moderate':
      return isDeteriorating ? '1-hourly' : '2-hourly';
    case 'High':
      return isDeteriorating ? 'Half-hourly' : '1-hourly';
    case 'MET':
      return '10-minutely';
    default:
      return '8-hourly';
  }
}

// ---------------------------------------------------------------------------
// Backward-compatible aliases
// ---------------------------------------------------------------------------

/** @deprecated Use {@link calculateQADDS} instead. */
export const calculateNEWS2 = calculateQADDS;

/** @deprecated Use {@link getQADDSRiskLevel} instead. */
export const getClinicalRisk = getQADDSRiskLevel;
