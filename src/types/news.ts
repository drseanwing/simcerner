/**
 * Q-ADDS scoring configuration types.
 *
 * Defines threshold bands and colour mappings used by the Q-ADDS calculator.
 * Each parameter has value ranges mapping to sub-scores (0–4 or E) and
 * visual colour codes following the Queensland Health Q-ADDS chart.
 */

import type { QaddsParameter, QaddsSubScoreValue, ClinicalRisk } from './vitals';

// ---------------------------------------------------------------------------
// Colour Codes
// ---------------------------------------------------------------------------

/**
 * Q-ADDS cell colour codes corresponding to sub-score severity.
 *
 * - 'white'  : Score 0 — within normal range
 * - 'yellow' : Score 1 — mild deviation
 * - 'orange' : Score 2 — moderate deviation
 * - 'red'    : Score 3 or 4 — severe deviation
 * - 'purple' : Score E — emergency / MET trigger
 */
export type QaddsColorCode = 'white' | 'yellow' | 'orange' | 'red' | 'purple';

// ---------------------------------------------------------------------------
// Scoring Thresholds
// ---------------------------------------------------------------------------

/**
 * A single threshold band for a Q-ADDS parameter.
 * Boundaries are inclusive on both ends.
 */
export interface QaddsScoreThreshold {
  min: number;
  max: number;
  score: QaddsSubScoreValue;
  color: QaddsColorCode;
}

/**
 * Complete scoring configuration for a single Q-ADDS parameter.
 */
export interface QaddsParameterConfig {
  parameter: QaddsParameter;
  label: string;
  unit: string;
  thresholds: QaddsScoreThreshold[];
}

// ---------------------------------------------------------------------------
// Risk Thresholds
// ---------------------------------------------------------------------------

/**
 * Maps an aggregate Q-ADDS score range to a clinical risk level and
 * escalation action.
 */
export interface QaddsRiskThreshold {
  minScore: number;
  maxScore: number;
  risk: ClinicalRisk;
  color: QaddsColorCode;
  escalation: string;
}

// ---------------------------------------------------------------------------
// Scoring System Configuration
// ---------------------------------------------------------------------------

export type ScoringSystem = 'Q-ADDS';

export interface ScoringSystemConfig {
  system: ScoringSystem;
  displayName: string;
  parameters: QaddsParameterConfig[];
  riskThresholds: QaddsRiskThreshold[];
}
