/**
 * MET-MEO (Modified Escalation and Observation) system types.
 *
 * Queensland Health allows clinicians to modify the standard escalation
 * response for patients who persistently trigger MET call criteria
 * (EWS >= 8 or any vital sign in the E zone) through two order types:
 *
 *   1. MET-MEO Plan Order — modifies the escalation response so that a
 *      full MET call is not activated every time the patient re-triggers.
 *
 *   2. Modified Observation Frequency (MOF) Order — reduces the frequency
 *      of full vital-sign observation sets. Requires SMO authorisation.
 *
 * Both orders carry strict duration limits and require ongoing nursing
 * assessment to ensure patient safety.
 */

// ---------------------------------------------------------------------------
// MET-MEO Plan Order
// ---------------------------------------------------------------------------

/**
 * MET-MEO Plan Order — orders a modified escalation response for patients
 * meeting MET call criteria (EWS >= 8 or any vital sign in E zone).
 */
export interface MetMeoOrder {
  orderId: string
  orderType: 'MET_MEO_PLAN'
  triggerType: 'EWS_GTE_8' | 'E_ZONE' | 'BOTH'

  /** Step 2: E-zone vital sign acceptable range (only when triggerType includes E_ZONE) */
  eZoneVitalSign: 'rr' | 'systolicBP' | 'heartRate' | 'consciousness' | null
  eZoneLowerBound: number | null
  eZoneUpperBound: number | null
  /** Only populated for consciousness — the acceptable CAVPU level */
  eZoneCavpuLevel: string | null

  /** Step 3: Rationale for the modified escalation plan */
  rationale: string

  /** Step 4: Duration and authorisation */
  durationHours: number // max 12 for General/Chronic, max 24 for Cardiac
  authorisingClinicianName: string
  authorisingClinicianRole: 'REGISTRAR' | 'SMO'

  /** ISO datetime when the order was signed */
  signedAt: string
  /** ISO datetime when the order expires (signedAt + durationHours) */
  expiresAt: string
  /** ISO datetime when the order was cancelled, or null if still active/expired */
  cancelledAt: string | null

  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
}

// ---------------------------------------------------------------------------
// Modified Observation Frequency (MOF) Order
// ---------------------------------------------------------------------------

/**
 * Modified Observation Frequency Order — reduces observation frequency.
 * Requires SMO authorisation (NOT Registrar).
 */
export interface ModifiedObsFrequencyOrder {
  orderId: string
  orderType: 'MODIFIED_OBS_FREQUENCY'

  optionSelected: 'LONG_STAY_RESPITE' | 'STABLE_EXPECTED' | 'REDUCE_DISTRESS_ARP' | 'OTHER'
  frequencyHours: number
  /** Free-text reason — only populated when optionSelected === 'OTHER' */
  otherFreeText: string | null

  /** SMO only — name of the authorising Senior Medical Officer */
  authorisingSmoName: string

  signedAt: string
  cancelledAt: string | null
  status: 'ACTIVE' | 'CANCELLED'
}

/** Union type for either order type */
export type MeoOrder = MetMeoOrder | ModifiedObsFrequencyOrder

// ---------------------------------------------------------------------------
// Nursing Assessment
// ---------------------------------------------------------------------------

/**
 * Nursing assessment recorded under an active MET-MEO plan.
 *
 * After every observation set, the bedside nurse records whether the
 * patient is stable or deteriorating and which deterioration criteria
 * (if any) were triggered.
 */
export interface NursingAssessment {
  assessmentId: string
  metMeoOrderId: string | null
  assessmentTime: string
  patientStatus: 'STABLE' | 'DETERIORATING'
  observationComments: string | null

  /** Deterioration criteria flags */
  criterionConcernWorse: boolean
  /**
   * For EWS >= 8: "NEW contributing vital sign(s)"
   * For E zone:   "Any vital sign(s) worse"
   */
  criterionNewVitalSigns: boolean
  /**
   * For EWS >= 8: "Score higher than last score"
   * For E zone:   "E zone vital sign outside accepted range"
   */
  criterionScoreHigher: boolean
}

// ---------------------------------------------------------------------------
// Sedation Assessment
// ---------------------------------------------------------------------------

/** Sedation score levels (score 3 triggers Emergency response) */
export type SedationLevel = 0 | 1 | 2 | 3

export interface SedationAssessment {
  assessmentId: string
  assessmentTime: string
  score: SedationLevel
  comments: string | null
}

/** Labels for each sedation level */
export const SEDATION_LABELS: Record<SedationLevel, string> = {
  0: 'Awake',
  1: 'Mild (easy to rouse, eyes open \u226510 sec)',
  2: 'Moderate (rouseable, eyes open <10 sec)',
  3: 'Severe (difficult to rouse/unrouseable)',
}

/** Required clinical actions by sedation level */
export const SEDATION_ACTIONS: Record<SedationLevel, string> = {
  0: 'Continue to monitor per individual plan.',
  1: 'Increase monitoring. Recheck before administering sedating meds.',
  2: 'Ensure O\u2082 & monitor SpO\u2082. Withhold sedating meds. Notify TL. Notify MO to review within 15 min. Monitor Q-ADDS/Sedation/Pain min 15 minutely.',
  3: 'Initiate Emergency Response. Ensure O\u2082 & monitor SpO\u2082. Determine need for reversal agent (naloxone, flumazenil).',
}

// ---------------------------------------------------------------------------
// MOF Option Labels
// ---------------------------------------------------------------------------

/** Labels for the Modified Observation Frequency order form options */
export const MOF_OPTION_LABELS: Record<ModifiedObsFrequencyOrder['optionSelected'], string> = {
  LONG_STAY_RESPITE:
    'Full EWS at least {hours} hourly for stable long stay or respite patients where clinical status has been as expected for > 24 hours (e.g. Rehab/residential care/non-clinical admissions)',
  STABLE_EXPECTED:
    'Full EWS at least {hours} hourly in stable patient where clinical status has been as expected for > 24 hours (e.g. respiratory viruses)',
  REDUCE_DISTRESS_ARP:
    "Full EWS at least {hours} hourly to reduce distress in unwell patient on optimal treatment where 'ward-based care' documented on ARP",
  OTHER: 'Other',
}

// ---------------------------------------------------------------------------
// E-Zone Vital Sign Options
// ---------------------------------------------------------------------------

/** Configuration for an E-zone vital sign option in the MET-MEO Plan Order form (Step 2) */
export interface EZoneVitalSignOption {
  value: 'rr' | 'systolicBP' | 'heartRate' | 'consciousness'
  label: string
  unit: string
  normalRange: string
  inputType: 'numeric' | 'dropdown'
}

/** E-zone vital sign options for Step 2 of MET-MEO Plan Order */
export const E_ZONE_VITAL_SIGN_OPTIONS: EZoneVitalSignOption[] = [
  { value: 'rr', label: 'Respiratory rate', unit: 'brpm', normalRange: '13\u201320 brpm', inputType: 'numeric' },
  { value: 'systolicBP', label: 'SBP', unit: 'mmHg', normalRange: '110\u2013159 mmHg', inputType: 'numeric' },
  { value: 'heartRate', label: 'Heart rate', unit: 'bpm', normalRange: '50\u201399 bpm', inputType: 'numeric' },
  { value: 'consciousness', label: 'CAVPU', unit: '', normalRange: 'Alert', inputType: 'dropdown' },
]
