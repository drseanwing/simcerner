/**
 * NEWS2 scoring configuration types for the PowerChart EMR simulation.
 *
 * These types define the scoring thresholds and colour mappings used by
 * the NEWS2 (and Q-ADDS) score calculator. Each physiological parameter
 * has a set of value ranges that map to sub-scores (0-3) and visual
 * colour codes following the NHS NEWS2 colour chart.
 *
 * @see https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/
 */

import type { NewsParameter } from './vitals';

// ---------------------------------------------------------------------------
// Colour Codes
// ---------------------------------------------------------------------------

/**
 * NEWS2 cell colour codes corresponding to sub-score severity.
 *
 * - 'white'  : Score 0 - within normal range
 * - 'yellow' : Score 1 - mild deviation
 * - 'orange' : Score 2 - moderate deviation
 * - 'red'    : Score 3 - severe deviation / critical
 */
export type NewsColorCode = 'white' | 'yellow' | 'orange' | 'red';

// ---------------------------------------------------------------------------
// Scoring Thresholds
// ---------------------------------------------------------------------------

/**
 * A single scoring threshold band for a NEWS2 parameter.
 *
 * Defines the value range [min, max] that maps to a specific sub-score
 * and its associated colour code. Boundaries are inclusive on both ends.
 *
 * For example, a respiratory rate threshold might be:
 * { min: 12, max: 20, score: 0, color: 'white' }   -- normal range
 * { min: 21, max: 24, score: 2, color: 'orange' }   -- moderate deviation
 */
export interface NewsScoreThreshold {
  /** Lower boundary of this threshold band (inclusive) */
  min: number;
  /** Upper boundary of this threshold band (inclusive). Use Infinity for open-ended upper bounds. */
  max: number;
  /** The NEWS2 sub-score assigned when the value falls within this range */
  score: 0 | 1 | 2 | 3;
  /** The colour code for visual display of this severity level */
  color: NewsColorCode;
}

/**
 * Complete scoring configuration for a single NEWS2 physiological parameter.
 *
 * Contains the parameter identifier and an ordered array of threshold bands
 * that cover the full range of possible measured values. The calculator
 * evaluates the measured value against each threshold to determine the sub-score.
 */
export interface NewsParameterConfig {
  /** The physiological parameter this configuration applies to */
  parameter: NewsParameter;
  /** Display label for the parameter, e.g. "Respiratory Rate", "SpO2 Scale 1" */
  label: string;
  /** Unit of measurement, e.g. "bpm", "%", "degC", "mmHg" */
  unit: string;
  /**
   * Ordered array of scoring threshold bands.
   * Should cover all possible values without gaps.
   * The calculator checks each band in order and uses the first match.
   */
  thresholds: NewsScoreThreshold[];
}

// ---------------------------------------------------------------------------
// Scoring System Configuration
// ---------------------------------------------------------------------------

/**
 * Identifies the scoring system in use.
 *
 * - 'NEWS2'  : National Early Warning Score 2 (UK standard, widely adopted in Australia)
 * - 'Q-ADDS' : Queensland Adult Deterioration Detection System (QLD-specific variant)
 */
export type ScoringSystem = 'NEWS2' | 'Q-ADDS';

/**
 * Complete configuration for a NEWS2 or Q-ADDS scoring system.
 *
 * Contains all parameter configurations needed to calculate the aggregate
 * score from a set of vital sign observations. Different scoring systems
 * (NEWS2 vs Q-ADDS) use different threshold values.
 */
export interface ScoringSystemConfig {
  /** Identifier for this scoring system */
  system: ScoringSystem;
  /** Human-readable name, e.g. "National Early Warning Score 2" */
  displayName: string;
  /** Configuration for each of the scored parameters */
  parameters: NewsParameterConfig[];
  /**
   * Clinical risk level thresholds based on aggregate score.
   * Maps a minimum total score to its corresponding risk level.
   */
  riskThresholds: NewsRiskThreshold[];
}

/**
 * A threshold that maps an aggregate NEWS2 score range to a clinical risk level.
 *
 * For example:
 * { minScore: 0, maxScore: 4, risk: 'Low', escalation: 'Continue routine monitoring' }
 * { minScore: 7, maxScore: 21, risk: 'High', escalation: 'Emergency response' }
 */
export interface NewsRiskThreshold {
  /** Minimum aggregate score for this risk level (inclusive) */
  minScore: number;
  /** Maximum aggregate score for this risk level (inclusive) */
  maxScore: number;
  /** The clinical risk classification */
  risk: 'Low' | 'Low-Medium' | 'Medium' | 'High';
  /** Recommended clinical escalation action */
  escalation: string;
}
