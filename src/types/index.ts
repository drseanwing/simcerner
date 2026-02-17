/**
 * @file index.ts
 * @description Barrel export for all SimCerner EMR type definitions.
 *
 * Re-exports every interface, type, enum, and constant from the
 * domain-specific type modules so consumers can import from a
 * single entry point:
 *
 * ```ts
 * import type { Patient, VitalSign, NEWS2Result } from './types';
 * import { MedicationDoseStatus, NEWS2_THRESHOLDS } from './types';
 * ```
 */

// Patient data model — demographics, vitals, medications, orders, labs, notes
export type {
  Gender,
  AVPUScale,
  PatientDemographics,
  VitalSign,
  FluidBalanceEntryFlat,
  FluidBalanceEntryHierarchical,
  FluidBalanceEntry,
  MedicationStatus,
  Medication,
  OrderType,
  OrderStatus,
  OrderPriority,
  Order,
  LabFlag,
  LabResult,
  LabResults,
  NoteType,
  ClinicalRole,
  ClinicalNote,
  Patient,
} from './patient';

// Vital signs display configuration
export type {
  NormalRange,
  VitalParameter,
  VitalSignDisplayConfig,
} from './vitals';
export { VITAL_PARAMETERS } from './vitals';

// Medication administration types
export type {
  MedicationAdministration,
  MARTimeSlot,
  TherapeuticClass,
} from './medications';
export { MedicationDoseStatus } from './medications';

// NEWS2 / Q-ADDS scoring
export type {
  ClinicalRisk,
  EscalationLevel,
  NEWS2SubScore,
  NEWS2Result,
  ScoreThresholdBand,
  ParameterThresholds,
  ScoreThresholds,
  ClinicalRiskThresholds,
} from './news';
export {
  ScoringSystem,
  NEWS2_THRESHOLDS,
  AVPU_NUMERIC_MAP,
  CLINICAL_RISK_THRESHOLDS,
} from './news';
