/**
 * @file index.ts
 * @description Barrel export for all SimCerner EMR type definitions.
 *
 * Re-exports every interface, type, enum, and constant from the
 * domain-specific type modules so consumers can import from a
 * single entry point:
 *
 * ```ts
 * import type { Patient, VitalSign, QADDSResult } from './types';
 * import { MedicationDoseStatus, QADDS_THRESHOLDS } from './types';
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

// iView (Interactive View) clinical documentation
export type {
  AssessmentInputType,
  AssessmentParameter,
  IViewSection,
  IViewBand,
  AssessmentEntry,
  TimeInterval,
  IViewToolbarConfig,
} from './iview';

// Q-ADDS scoring — new canonical types
export type {
  QADDSScore,
  QADDSSubScore,
  QADDSResult,
  QADDSRiskLevel,
  QADDSScoreThresholdBand,
  ChartVariant,
  EscalationLevel,
  ParameterThresholds,
  ScoreThresholds,
  ClinicalRiskThresholds,
} from './news';

// Q-ADDS scoring — new canonical constants
export {
  QADDS_THRESHOLDS,
  QADDS_RISK_THRESHOLDS,
  AVPU_NUMERIC_MAP,
} from './news';

// MET-MEO workflow types
export type {
  MEOOrderType,
  METMEOTriggerType,
  METMEOOrderStatus,
  AuthorisingRole,
  METMEOOrder,
  MOFOption,
  ModifiedObsFrequencyOrder,
  PatientStatus,
  NursingAssessment,
  METCallReason,
  METCallCriteria,
} from './metmeo';

// Backward-compatible aliases (NEWS2 -> Q-ADDS)
export type {
  ClinicalRisk,
  NEWS2SubScore,
  NEWS2Result,
  ScoreThresholdBand,
} from './news';
export {
  NEWS2_THRESHOLDS,
  CLINICAL_RISK_THRESHOLDS,
} from './news';
