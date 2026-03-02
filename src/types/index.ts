/**
 * Barrel export for all TypeScript type definitions.
 *
 * Re-exports every public type from the domain-specific type modules so that
 * consumers can import from a single entry point:
 *
 *   import type { Patient, QaddsScore, MAREntry } from '@/types';
 */

// Patient data models — demographics, vitals, medications, orders, results, notes
export type {
  AVPUScale,
  VitalSign,
  FluidBalanceEntryFlat,
  FluidBalanceEntryNormalized,
  FluidBalanceEntry,
  Medication,
  Order,
  LabResult,
  LabResults,
  ClinicalNote,
  Patient,
  PatientMap,
} from './patient';

// Q-ADDS scoring — aggregate scores, sub-scores, risk levels
export type {
  ClinicalRisk,
  QaddsParameter,
  QaddsSubScoreValue,
  QaddsSubScore,
  QaddsSubScores,
  QaddsScore,
  QaddsScoreTrend,
} from './vitals';

// Medication Administration Record (MAR) — grid cells, entries, therapeutic classes
export type {
  AdministrationStatus,
  MARCellData,
  MAREntry,
  TherapeuticClass,
  MARStatusColor,
  MARTimeWindow,
} from './medications';

// Q-ADDS scoring configuration — thresholds, colour codes, system config
export type {
  QaddsColorCode,
  QaddsScoreThreshold,
  QaddsParameterConfig,
  ScoringSystem,
  ScoringSystemConfig,
  QaddsRiskThreshold,
} from './news';

// MET-MEO (Modified Escalation and Observation) — orders, assessments, sedation
export type {
  MetMeoOrder,
  ModifiedObsFrequencyOrder,
  MeoOrder,
  NursingAssessment,
  SedationLevel,
  SedationAssessment,
  EZoneVitalSignOption,
} from './meo';
