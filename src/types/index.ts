/**
 * Barrel export for all TypeScript type definitions.
 *
 * Re-exports every public type from the domain-specific type modules so that
 * consumers can import from a single entry point:
 *
 *   import type { Patient, NewsScore, MAREntry } from '@/types';
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

// NEWS2 / Q-ADDS scoring — aggregate scores, sub-scores, risk levels
export type {
  ClinicalRisk,
  NewsParameter,
  NewsSubScore,
  NewsSubScores,
  NewsScore,
  NewsScoreTrend,
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

// NEWS2 scoring configuration — thresholds, colour codes, system config
export type {
  NewsColorCode,
  NewsScoreThreshold,
  NewsParameterConfig,
  ScoringSystem,
  ScoringSystemConfig,
  NewsRiskThreshold,
} from './news';
