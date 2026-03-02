/**
 * @file metmeo.ts
 * @description MET-MEO (Modified Escalation and Observation) types for the
 * SimCerner EMR application.
 *
 * Implements the Queensland Health ieMR MET-MEO workflow data model
 * for managing patients who meet MET call criteria (EWS >= 8 or E-zone).
 *
 * @see docs/met-meo.md
 */

// ---------------------------------------------------------------------------
// MET-MEO Order
// ---------------------------------------------------------------------------

/** Type of MEO order. */
export type MEOOrderType = 'MET_MEO_PLAN' | 'MODIFIED_OBS_FREQUENCY';

/** What triggered the MET-MEO criteria. */
export type METMEOTriggerType = 'EWS_GTE_8' | 'E_ZONE' | 'BOTH';

/** Lifecycle status of a MET-MEO order. */
export type METMEOOrderStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

/** Role of the authorising clinician. */
export type AuthorisingRole = 'REGISTRAR' | 'SMO';

/**
 * A MET-MEO Plan order that modifies the standard escalation response
 * for a patient meeting MET call criteria.
 */
export interface METMEOOrder {
  /** Unique order identifier. */
  orderId: string;

  /** Patient MRN this order applies to. */
  patientId: string;

  /** Type of order (MET-MEO Plan or Modified Obs Frequency). */
  orderType: MEOOrderType;

  /** What triggered the MET-MEO criteria. */
  triggerType: METMEOTriggerType;

  /**
   * If triggered by E-zone: which vital sign is in the E-zone.
   * Only populated when triggerType includes E_ZONE.
   */
  eZoneVitalSign?: string;

  /**
   * Acceptable lower bound for the E-zone vital sign.
   * Only populated when eZoneVitalSign is set.
   */
  eZoneLowerBound?: number;

  /**
   * Acceptable upper bound for the E-zone vital sign.
   * Only populated when eZoneVitalSign is set.
   */
  eZoneUpperBound?: number;

  /**
   * For consciousness/AVPU E-zone: the acceptable CAVPU level.
   * Only populated when eZoneVitalSign is 'consciousness'.
   */
  eZoneCavpuLevel?: string;

  /** Clinical rationale for the MET-MEO plan (required, free text). */
  rationale: string;

  /** Duration of the order in hours (max 12h General Adult, 24h Cardiac). */
  durationHours: number;

  /** ID/name of the authorising clinician. */
  authorisingClinicianId: string;

  /** Role of the authorising clinician. */
  authorisingClinicianRole: AuthorisingRole;

  /** ISO-8601 timestamp when the order was signed. */
  signedAt: string;

  /** ISO-8601 timestamp when the order expires. */
  expiresAt: string;

  /** ISO-8601 timestamp when the order was cancelled (if applicable). */
  cancelledAt?: string;

  /** Current lifecycle status. */
  status: METMEOOrderStatus;
}

// ---------------------------------------------------------------------------
// Modified Observation Frequency (MOF) — SMO Only
// ---------------------------------------------------------------------------

/** Pre-defined MOF option categories. */
export type MOFOption =
  | 'LONG_STAY_RESPITE'
  | 'STABLE_EXPECTED'
  | 'REDUCE_DISTRESS_ARP'
  | 'OTHER';

/**
 * A Modified Observation Frequency order that reduces how often
 * observations are taken. Requires SMO authorisation.
 */
export interface ModifiedObsFrequencyOrder {
  /** Unique order identifier. */
  orderId: string;

  /** Patient MRN. */
  patientId: string;

  /** Selected MOF option. */
  optionSelected: MOFOption;

  /** Observation frequency in hours. */
  frequencyHours: number;

  /** Free text when optionSelected is 'OTHER'. */
  otherFreeText?: string;

  /** ID/name of the authorising SMO. */
  authorisingSmoId: string;

  /** ISO-8601 timestamp when signed. */
  signedAt: string;

  /** ISO-8601 timestamp when cancelled (if applicable). */
  cancelledAt?: string;

  /** Current lifecycle status. */
  status: METMEOOrderStatus;
}

// ---------------------------------------------------------------------------
// Nursing Assessment under MET-MEO
// ---------------------------------------------------------------------------

/** Patient status during nursing assessment. */
export type PatientStatus = 'STABLE' | 'DETERIORATING';

/**
 * A nursing assessment performed under an active MET-MEO plan.
 * Evaluates the three deterioration criteria.
 */
export interface NursingAssessment {
  /** Unique assessment identifier. */
  assessmentId: string;

  /** Patient MRN. */
  patientId: string;

  /** The MET-MEO order this assessment is under. */
  metMeoOrderId: string;

  /** ISO-8601 timestamp of the assessment. */
  assessmentTime: string;

  /** Overall patient status determination. */
  patientStatus: PatientStatus;

  /** Free text observation comments. */
  observationComments?: string;

  /** Criterion 1: Concern patient is worse or not improving. */
  criterionConcernWorse: boolean;

  /** Criterion 2: New contributing vital sign(s). */
  criterionNewVitalSigns: boolean;

  /**
   * Criterion 3 (EWS >= 8 trigger): Score higher than last score.
   * OR (E-zone trigger): E-zone vital sign outside accepted range.
   */
  criterionScoreHigherOrOutsideRange: boolean;
}

// ---------------------------------------------------------------------------
// MET Call Criteria
// ---------------------------------------------------------------------------

/** Reasons a MET call may be initiated. */
export type METCallReason =
  | 'AIRWAY_THREAT'
  | 'CARDIAC_ARREST'
  | 'RESPIRATORY_ARREST'
  | 'CLINICIAN_CONCERN'
  | 'SEIZURE'
  | 'EWS_GTE_8'
  | 'E_ZONE'
  | 'SEDATION_SCORE_3';

/**
 * Represents MET call criteria evaluation for a patient.
 */
export interface METCallCriteria {
  /** Whether MET call criteria are met. */
  criteriaMet: boolean;

  /** List of reasons the criteria are met. */
  reasons: METCallReason[];

  /** Specific E-zone parameters if applicable. */
  eZoneParameters?: string[];

  /** Current EWS score. */
  ewsScore: number;
}
