/**
 * @file vitals.ts
 * @description Vital signs display configuration and parameter definitions
 * for the SimCerner EMR application.
 *
 * Provides the canonical list of monitored vital parameters with their
 * units, normal ranges, and display metadata used by the vitals chart,
 * observation table, and Q-ADDS EWS scoring engine.
 */

// ---------------------------------------------------------------------------
// Vital Parameter Configuration
// ---------------------------------------------------------------------------

/**
 * Normal range boundaries for a vital sign parameter.
 * Values outside this range are flagged as abnormal in the UI.
 */
export interface NormalRange {
  /** Lower bound of the normal range (inclusive). */
  min: number;

  /** Upper bound of the normal range (inclusive). */
  max: number;
}

/**
 * Configuration for a single vital sign parameter, defining how it
 * is labelled, keyed into data objects, and what constitutes a normal value.
 *
 * @example
 * ```ts
 * const hrParam: VitalParameter = {
 *   label: 'Heart Rate',
 *   key: 'hr',
 *   unit: 'bpm',
 *   normalRange: { min: 51, max: 90 },
 * };
 * ```
 */
export interface VitalParameter {
  /** Human-readable display label. */
  label: string;

  /** Property key matching the field name on the `VitalSign` interface. */
  key: string;

  /** Unit of measurement shown alongside the value. */
  unit: string;

  /** Normal reference range; values outside trigger abnormal highlighting. */
  normalRange: NormalRange;
}

/**
 * Display configuration for the vitals panel, controlling which
 * parameters are visible and how they are rendered.
 */
export interface VitalSignDisplayConfig {
  /** Ordered list of parameters to display. */
  parameters: VitalParameter[];

  /** Whether to show the trend sparkline chart. */
  showTrend: boolean;

  /** Whether to highlight out-of-range values with colour coding. */
  highlightAbnormal: boolean;

  /** Maximum number of historical observations to show in the table. */
  maxHistoryRows: number;

  /** Whether to display the calculated EWS score row. */
  showNewsScore: boolean;
}

// ---------------------------------------------------------------------------
// Standard Vital Parameters
// ---------------------------------------------------------------------------

/**
 * Canonical list of standard vital sign parameters monitored in the
 * SimCerner application. Normal ranges are based on standard adult
 * clinical reference values and align with Q-ADDS scoring boundaries.
 */
export const VITAL_PARAMETERS: readonly VitalParameter[] = [
  {
    label: 'Temperature',
    key: 'temp',
    unit: '°C',
    normalRange: { min: 36.1, max: 38.0 },
  },
  {
    label: 'Heart Rate',
    key: 'hr',
    unit: 'bpm',
    normalRange: { min: 51, max: 90 },
  },
  {
    label: 'Respiratory Rate',
    key: 'rr',
    unit: 'breaths/min',
    normalRange: { min: 12, max: 20 },
  },
  {
    label: 'Systolic BP',
    key: 'bp_sys',
    unit: 'mmHg',
    normalRange: { min: 111, max: 219 },
  },
  {
    label: 'Diastolic BP',
    key: 'bp_dia',
    unit: 'mmHg',
    normalRange: { min: 60, max: 90 },
  },
  {
    label: 'SpO2',
    key: 'spo2',
    unit: '%',
    normalRange: { min: 96, max: 100 },
  },
  {
    label: 'Pain Score',
    key: 'painScore',
    unit: '/10',
    normalRange: { min: 0, max: 3 },
  },
] as const;

// ---------------------------------------------------------------------------
// Q-ADDS Scoring Types (legacy aliases maintained for compatibility)
// ---------------------------------------------------------------------------

/** Q-ADDS clinical risk classification. */
export type ClinicalRisk = 'Routine' | 'Low' | 'Moderate' | 'High' | 'Emergency';

/** Q-ADDS scored parameters (legacy naming). */
export type QaddsParameter =
  | 'rr'
  | 'spo2'
  | 'o2FlowRate'
  | 'temperature'
  | 'systolicBP'
  | 'heartRate'
  | 'consciousness';

/** Q-ADDS sub-score values. */
export type QaddsSubScoreValue = 0 | 1 | 2 | 3 | 4 | 'E';

/** A sub-score for a single Q-ADDS parameter. */
export interface QaddsSubScore {
  parameter: QaddsParameter;
  value: string | number;
  score: QaddsSubScoreValue;
}

/** Map of parameter → sub-score. */
export type QaddsSubScores = Record<QaddsParameter, QaddsSubScore>;

/** Complete Q-ADDS score for a set of vitals. */
export interface QaddsScore {
  totalScore: number;
  hasEmergency: boolean;
  emergencyParameters: QaddsParameter[];
  clinicalRisk: ClinicalRisk;
  subScores: QaddsSubScores;
}

/** Q-ADDS score paired with timestamp (for trend graph). */
export interface QaddsScoreTrend {
  datetime: string;
  score: QaddsScore;
}

/** Observation chart variant. */
export type ChartVariant =
  | 'standard'
  | 'chronic_respiratory'
  | 'SW150'
  | 'SW626'
  | 'SW1171';

/** Patient clinical status for escalation pathway. */
export type PatientStatus = 'deteriorating' | 'stable';
