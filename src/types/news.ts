/**
 * @file news.ts
 * @description NEWS2 (National Early Warning Score 2) and Q-ADDS scoring
 * types and threshold constants for the SimCerner EMR application.
 *
 * Implements the Royal College of Physicians NEWS2 scoring system used
 * to detect acute clinical deterioration in adult patients. Includes
 * configurable threshold tables, sub-score breakdowns, clinical risk
 * classification, and escalation levels.
 *
 * @see https://www.rcplondon.ac.uk/projects/outputs/national-early-warning-score-news-2
 */

// ---------------------------------------------------------------------------
// Scoring System Selection
// ---------------------------------------------------------------------------

/** Supported early warning scoring systems. */
export const ScoringSystem = {
  /** National Early Warning Score 2 (UK standard). */
  NEWS2: 'NEWS2',

  /** Queensland Adult Deterioration Detection System (Australian). */
  QADDS: 'QADDS',
} as const;

export type ScoringSystem = typeof ScoringSystem[keyof typeof ScoringSystem];

// ---------------------------------------------------------------------------
// Clinical Risk & Escalation
// ---------------------------------------------------------------------------

/**
 * Clinical risk level derived from the aggregate NEWS2 score.
 *
 * | Risk         | Aggregate Score              |
 * |--------------|------------------------------|
 * | Low          | 0–4 (no individual param ≥ 3)|
 * | Low-Medium   | Any individual param = 3     |
 * | Medium       | 5–6 (or single param = 3)    |
 * | High         | ≥ 7                          |
 */
export type ClinicalRisk = 'Low' | 'Low-Medium' | 'Medium' | 'High';

/**
 * Recommended escalation response mapped from clinical risk.
 *
 * | Level | Action                                         |
 * |-------|------------------------------------------------|
 * | 0     | Continue routine monitoring                     |
 * | 1     | Increase observation frequency                  |
 * | 2     | Urgent clinical review by ward team             |
 * | 3     | Emergency response — critical care outreach     |
 */
export type EscalationLevel = 0 | 1 | 2 | 3;

// ---------------------------------------------------------------------------
// Sub-Score & Result
// ---------------------------------------------------------------------------

/**
 * Individual NEWS2 sub-score for a single physiological parameter.
 */
export interface NEWS2SubScore {
  /** Name of the physiological parameter (e.g. "Respiratory Rate"). */
  parameter: string;

  /** Measured value as a number or descriptive string. */
  value: number | string;

  /** Assigned score for this parameter (0, 1, 2, or 3). */
  score: 0 | 1 | 2 | 3;
}

/**
 * Complete NEWS2 scoring result aggregating all sub-scores with
 * clinical risk classification and escalation guidance.
 */
export interface NEWS2Result {
  /** Sum of all individual parameter scores. */
  totalScore: number;

  /** Breakdown of score contributions by parameter. */
  subScores: NEWS2SubScore[];

  /** Derived clinical risk category. */
  clinicalRisk: ClinicalRisk;

  /** Recommended escalation level. */
  escalationLevel: EscalationLevel;
}

// ---------------------------------------------------------------------------
// Score Threshold Configuration
// ---------------------------------------------------------------------------

/**
 * A single threshold band mapping a value range to a NEWS2 score.
 *
 * @example
 * ```ts
 * // Heart rate 51-90 bpm scores 0
 * const band: ScoreThresholdBand = { min: 51, max: 90, score: 0 };
 * ```
 */
export interface ScoreThresholdBand {
  /** Lower bound of the range (inclusive). Use -Infinity for "≤ X" ranges. */
  min: number;

  /** Upper bound of the range (inclusive). Use Infinity for "≥ X" ranges. */
  max: number;

  /** NEWS2 score assigned when the value falls within this band. */
  score: 0 | 1 | 2 | 3;
}

/**
 * Threshold configuration for a single vital parameter, containing
 * ordered bands that cover the full value range.
 */
export interface ParameterThresholds {
  /** Parameter identifier matching the vital sign field key. */
  parameter: string;

  /** Human-readable parameter label. */
  label: string;

  /** Ordered score bands from lowest to highest value range. */
  bands: ScoreThresholdBand[];
}

/**
 * Complete threshold table mapping all NEWS2 parameters to their
 * scoring bands. Used by the scoring engine to compute sub-scores.
 */
export type ScoreThresholds = Record<string, ParameterThresholds>;

// ---------------------------------------------------------------------------
// NEWS2 Threshold Constants
// ---------------------------------------------------------------------------

/**
 * Official NHS NEWS2 scoring thresholds per physiological parameter.
 *
 * Based on the Royal College of Physicians NEWS2 chart:
 * - Respiratory Rate: ≤8→3, 9-11→1, 12-20→0, 21-24→2, ≥25→3
 * - SpO2 Scale 1: ≤91→3, 92-93→2, 94-95→1, ≥96→0
 * - SpO2 Scale 2: ≤83→3, 84-85→2, 86-87→1, 88-92+O2→0, 93-94 on air→1, 95-96 on air→2, ≥97 on air→3
 * - Supplemental O2: Yes→2, No→0
 * - Temperature: ≤35.0→3, 35.1-36.0→1, 36.1-38.0→0, 38.1-39.0→1, ≥39.1→2
 * - Systolic BP: ≤90→3, 91-100→2, 101-110→1, 111-219→0, ≥220→3
 * - Heart Rate: ≤40→3, 41-50→1, 51-90→0, 91-110→1, 111-130→2, ≥131→3
 * - Consciousness (AVPU): Alert→0, Confusion/Voice/Pain/Unresponsive→3
 */
export const NEWS2_THRESHOLDS: ScoreThresholds = {
  respiratoryRate: {
    parameter: 'rr',
    label: 'Respiratory Rate',
    bands: [
      { min: -Infinity, max: 8, score: 3 },
      { min: 9, max: 11, score: 1 },
      { min: 12, max: 20, score: 0 },
      { min: 21, max: 24, score: 2 },
      { min: 25, max: Infinity, score: 3 },
    ],
  },

  spo2Scale1: {
    parameter: 'spo2',
    label: 'SpO2 Scale 1',
    bands: [
      { min: -Infinity, max: 91, score: 3 },
      { min: 92, max: 93, score: 2 },
      { min: 94, max: 95, score: 1 },
      { min: 96, max: Infinity, score: 0 },
    ],
  },

  spo2Scale2OnO2: {
    parameter: 'spo2',
    label: 'SpO2 Scale 2 (on supplemental O2)',
    bands: [
      { min: -Infinity, max: 83, score: 3 },
      { min: 84, max: 85, score: 2 },
      { min: 86, max: 87, score: 1 },
      { min: 88, max: 92, score: 0 },
      { min: 93, max: Infinity, score: 0 },
    ],
  },

  spo2Scale2OnAir: {
    parameter: 'spo2',
    label: 'SpO2 Scale 2 (on room air)',
    bands: [
      { min: -Infinity, max: 83, score: 3 },
      { min: 84, max: 85, score: 2 },
      { min: 86, max: 87, score: 1 },
      { min: 88, max: 92, score: 0 },
      { min: 93, max: 94, score: 1 },
      { min: 95, max: 96, score: 2 },
      { min: 97, max: Infinity, score: 3 },
    ],
  },

  supplementalO2: {
    parameter: 'supplementalO2',
    label: 'Supplemental Oxygen',
    bands: [
      { min: 0, max: 0, score: 0 },
      { min: 1, max: 1, score: 2 },
    ],
  },

  temperature: {
    parameter: 'temp',
    label: 'Temperature',
    bands: [
      { min: -Infinity, max: 35.0, score: 3 },
      { min: 35.1, max: 36.0, score: 1 },
      { min: 36.1, max: 38.0, score: 0 },
      { min: 38.1, max: 39.0, score: 1 },
      { min: 39.1, max: Infinity, score: 2 },
    ],
  },

  systolicBP: {
    parameter: 'bp_sys',
    label: 'Systolic Blood Pressure',
    bands: [
      { min: -Infinity, max: 90, score: 3 },
      { min: 91, max: 100, score: 2 },
      { min: 101, max: 110, score: 1 },
      { min: 111, max: 219, score: 0 },
      { min: 220, max: Infinity, score: 3 },
    ],
  },

  heartRate: {
    parameter: 'hr',
    label: 'Heart Rate',
    bands: [
      { min: -Infinity, max: 40, score: 3 },
      { min: 41, max: 50, score: 1 },
      { min: 51, max: 90, score: 0 },
      { min: 91, max: 110, score: 1 },
      { min: 111, max: 130, score: 2 },
      { min: 131, max: Infinity, score: 3 },
    ],
  },

  consciousness: {
    parameter: 'avpu',
    label: 'Consciousness (AVPU)',
    bands: [
      { min: 0, max: 0, score: 0 },
      { min: 1, max: 3, score: 3 },
    ],
  },
} as const;

/**
 * Mapping of AVPU scale letters to numeric values used by the
 * consciousness threshold bands.
 *
 * - A (Alert) → 0 → score 0
 * - C (new Confusion) → 1 → score 3
 * - V (Voice responsive) → 2 → score 3
 * - P (Pain responsive) → 3 → score 3
 * - U (Unresponsive) → 3 → score 3
 */
export const AVPU_NUMERIC_MAP: Readonly<Record<string, number>> = {
  A: 0,
  C: 1,
  V: 2,
  P: 3,
  U: 3,
} as const;

// ---------------------------------------------------------------------------
// Clinical Risk Thresholds
// ---------------------------------------------------------------------------

/**
 * Aggregate score thresholds for determining clinical risk level.
 * Used after summing all sub-scores to classify the overall result.
 */
export const CLINICAL_RISK_THRESHOLDS = {
  /** Score at or above which the patient is classified as High risk. */
  high: 7,

  /** Score range for Medium risk (5-6), or any single parameter scoring 3. */
  medium: 5,

  /**
   * Low-Medium is triggered when the aggregate is 0-4 but any single
   * parameter scores 3 (the "red score" rule).
   */
  lowMediumSingleParam: 3,
} as const;

/** Type for the clinical risk threshold configuration object. */
export type ClinicalRiskThresholds = typeof CLINICAL_RISK_THRESHOLDS;
