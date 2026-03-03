/**
 * @file ews.ts (keeping news.ts filename for now to avoid import breakage — will rename in cleanup)
 * @description Q-ADDS (Queensland Adult Deterioration Detection System) scoring
 * types and threshold constants for the SimCerner EMR application.
 *
 * Implements the Queensland Health Q-ADDS scoring system (SW150 General Adult variant).
 * @see docs/q-adds.md
 */

// ---------------------------------------------------------------------------
// Score Types
// ---------------------------------------------------------------------------

/** Possible Q-ADDS sub-scores: 0-4 numeric or 'E' for Emergency zone. */
export type QADDSScore = 0 | 1 | 2 | 3 | 4 | 'E';

/** Chart variant codes for Q-ADDS scoring tables. */
export type ChartVariant = 'SW150' | 'SW626' | 'SW1171';

// ---------------------------------------------------------------------------
// Clinical Risk & Escalation
// ---------------------------------------------------------------------------

/**
 * Q-ADDS graded response risk level derived from the aggregate score.
 *
 * | Risk     | Score Range | Key Action                    |
 * |----------|-------------|-------------------------------|
 * | Normal   | 0           | 8-hourly observations         |
 * | Low      | 1-3         | Notify TL, up to 4-hourly     |
 * | Moderate | 4-5         | Notify RMO within 30 min      |
 * | High     | 6-7         | Notify Registrar within 30 min|
 * | MET      | >=8 or E    | Initiate MET call             |
 */
export type QADDSRiskLevel = 'Normal' | 'Low' | 'Moderate' | 'High' | 'MET';

/**
 * Recommended escalation response mapped from risk level.
 * 0=routine, 1=increased obs, 2=RMO review, 3=Registrar review, 4=MET call
 */
export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

// Keep backward-compatible aliases for components still importing old names
export type ClinicalRisk = QADDSRiskLevel;

// ---------------------------------------------------------------------------
// Sub-Score & Result
// ---------------------------------------------------------------------------

export interface QADDSSubScore {
  parameter: string;
  value: number | string;
  score: QADDSScore;
}

export interface QADDSResult {
  totalScore: number;
  subScores: QADDSSubScore[];
  riskLevel: QADDSRiskLevel;
  escalationLevel: EscalationLevel;
  hasEZone: boolean;
  eZoneParameters: string[];
}

// Backward-compatible aliases
export type NEWS2SubScore = QADDSSubScore;
export type NEWS2Result = QADDSResult;

// ---------------------------------------------------------------------------
// Score Threshold Configuration
// ---------------------------------------------------------------------------

export interface QADDSScoreThresholdBand {
  min: number;
  max: number;
  score: QADDSScore;
}

// Keep old name as alias
export type ScoreThresholdBand = QADDSScoreThresholdBand;

export interface ParameterThresholds {
  parameter: string;
  label: string;
  bands: QADDSScoreThresholdBand[];
}

export type ScoreThresholds = Record<string, ParameterThresholds>;

// ---------------------------------------------------------------------------
// Q-ADDS Threshold Constants — SW150 General Adult
// ---------------------------------------------------------------------------
// Derived from docs/q-adds.md scoring tables

export const QADDS_THRESHOLDS: ScoreThresholds = {
  respiratoryRate: {
    parameter: 'rr',
    label: 'Respiratory Rate',
    bands: [
      { min: -Infinity, max: 8, score: 'E' },
      { min: 9, max: 12, score: 1 },
      { min: 13, max: 20, score: 0 },
      { min: 21, max: 24, score: 1 },
      { min: 25, max: 30, score: 2 },
      { min: 31, max: 35, score: 4 },
      { min: 36, max: Infinity, score: 'E' },
    ],
  },

  spo2Standard: {
    parameter: 'spo2',
    label: 'SpO2',
    bands: [
      { min: -Infinity, max: 84, score: 4 },
      { min: 85, max: 89, score: 2 },
      { min: 90, max: 91, score: 1 },
      { min: 92, max: Infinity, score: 0 },
    ],
  },

  o2Delivery: {
    parameter: 'o2FlowRate',
    label: 'Oxygen Delivery',
    bands: [
      { min: -Infinity, max: 1, score: 0 },
      { min: 2, max: 5, score: 1 },
      { min: 6, max: 11, score: 2 },
      { min: 12, max: 14, score: 4 },
      { min: 15, max: Infinity, score: 'E' },
    ],
  },

  systolicBP: {
    parameter: 'bp_sys',
    label: 'Systolic Blood Pressure',
    bands: [
      { min: -Infinity, max: 59, score: 'E' },
      { min: 60, max: 79, score: 'E' },
      { min: 80, max: 89, score: 4 },
      { min: 90, max: 99, score: 2 },
      { min: 100, max: 109, score: 1 },
      { min: 110, max: 159, score: 0 },
      { min: 160, max: 169, score: 1 },
      { min: 170, max: 199, score: 2 },
      { min: 200, max: Infinity, score: 4 },
    ],
  },

  heartRate: {
    parameter: 'hr',
    label: 'Heart Rate',
    bands: [
      { min: -Infinity, max: 39, score: 'E' },
      { min: 40, max: 49, score: 2 },
      { min: 50, max: 99, score: 0 },
      { min: 100, max: 109, score: 1 },
      { min: 110, max: 129, score: 2 },
      { min: 130, max: 139, score: 3 },
      { min: 140, max: 159, score: 4 },
      { min: 160, max: Infinity, score: 'E' },
    ],
  },

  temperature: {
    parameter: 'temp',
    label: 'Temperature',
    bands: [
      { min: -Infinity, max: 34.0, score: 4 },
      { min: 34.1, max: 35.0, score: 2 },
      { min: 35.1, max: 36.0, score: 1 },
      { min: 36.1, max: 37.9, score: 0 },
      { min: 38.0, max: 38.4, score: 1 },
      { min: 38.5, max: 39.4, score: 2 },
      { min: 39.5, max: Infinity, score: 2 },
    ],
  },

  consciousness: {
    parameter: 'avpu',
    label: 'Behaviour / Consciousness',
    bands: [
      { min: 0, max: 0, score: 0 },   // Alert
      { min: 1, max: 1, score: 1 },   // Voice
      { min: 4, max: 4, score: 4 },   // Confusion / New behaviour
      { min: 5, max: 5, score: 'E' }, // Pain
      { min: 6, max: 6, score: 'E' }, // Unresponsive
    ],
  },
};

// Backward-compatible alias
export const NEWS2_THRESHOLDS = QADDS_THRESHOLDS;

/**
 * AVPU mapping for Q-ADDS consciousness scoring.
 * A=0 (Alert), V=1 (Voice), C=4 (Confusion/New behaviour), P=5->E (Pain), U=6->E (Unresponsive)
 * Note: P and U map to high numbers that will match the 'E' band in consciousness thresholds.
 */
export const AVPU_NUMERIC_MAP: Readonly<Record<string, number>> = {
  A: 0,
  C: 4,
  V: 1,
  P: 5,
  U: 6,
} as const;

/**
 * Q-ADDS score thresholds for risk level determination.
 */
export const QADDS_RISK_THRESHOLDS = {
  met: 8,
  high: 6,
  moderate: 4,
  low: 1,
} as const;

// Backward-compatible alias
export const CLINICAL_RISK_THRESHOLDS = {
  high: 7,
  medium: 5,
  lowMediumSingleParam: 3,
} as const;

export type ClinicalRiskThresholds = typeof QADDS_RISK_THRESHOLDS;

// Legacy colour code type used by existing Q-ADDS calculator/tests.
export type QaddsColorCode = 'white' | 'yellow' | 'orange' | 'red' | 'purple';
