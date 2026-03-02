/**
 * NEWS2 / Q-ADDS scoring types for the PowerChart EMR simulation.
 *
 * The National Early Warning Score 2 (NEWS2) is calculated from 7 physiological
 * parameters. Each parameter receives a sub-score of 0-3, and the aggregate
 * determines the clinical risk level and escalation pathway.
 *
 * Q-ADDS (Queensland Adult Deterioration Detection System) uses a similar
 * approach with slightly different thresholds.
 */

// ---------------------------------------------------------------------------
// Clinical Risk Levels
// ---------------------------------------------------------------------------

/**
 * NEWS2 aggregate clinical risk classification.
 *
 * - 'Low'        : Total score 0-4 (aggregate)
 * - 'Low-Medium' : Total score of 3 in any single parameter
 * - 'Medium'     : Total score 5-6 (or 3 in a single parameter)
 * - 'High'       : Total score >= 7
 */
export type ClinicalRisk = 'Low' | 'Low-Medium' | 'Medium' | 'High';

// ---------------------------------------------------------------------------
// Sub-Scores
// ---------------------------------------------------------------------------

/**
 * The set of physiological parameters assessed in the NEWS2 scoring system.
 * Each parameter maps to a specific vital sign measurement.
 */
export type NewsParameter =
  | 'rr'
  | 'spo2'
  | 'supplementalO2'
  | 'temperature'
  | 'systolicBP'
  | 'heartRate'
  | 'consciousness';

/**
 * A sub-score for a single NEWS2 parameter.
 *
 * Each vital sign parameter is scored individually on a 0-3 scale,
 * where 0 is normal and 3 indicates the most severe deviation.
 */
export interface NewsSubScore {
  /** The physiological parameter being scored */
  parameter: NewsParameter;
  /** The measured value (as a string or number, matching the vital sign format) */
  value: string | number;
  /** The calculated sub-score for this parameter (0, 1, 2, or 3) */
  score: 0 | 1 | 2 | 3;
}

// ---------------------------------------------------------------------------
// Aggregate NEWS Score
// ---------------------------------------------------------------------------

/**
 * Sub-scores keyed by parameter name.
 * Each entry holds the individual scoring result for one of the 7 NEWS2 parameters.
 */
export type NewsSubScores = Record<NewsParameter, NewsSubScore>;

/**
 * The complete NEWS2 score for a single set of vital sign observations.
 *
 * Contains the aggregate total, the derived clinical risk level,
 * and the individual sub-scores for each of the 7 parameters.
 */
export interface NewsScore {
  /** Sum of all 7 parameter sub-scores (range 0-21) */
  totalScore: number;
  /** Clinical risk classification derived from the total score and individual triggers */
  clinicalRisk: ClinicalRisk;
  /** Individual sub-scores for each of the 7 NEWS2 parameters */
  subScores: NewsSubScores;
}

/**
 * A NEWS2 score paired with the timestamp of the vital signs it was calculated from.
 * Useful for plotting score trends over time.
 */
export interface NewsScoreTrend {
  /** Timestamp of the vital sign observation, e.g. "07-Apr-2021 14:00" */
  datetime: string;
  /** The calculated NEWS2 score for this observation */
  score: NewsScore;
}
