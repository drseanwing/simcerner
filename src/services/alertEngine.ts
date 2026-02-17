/**
 * @file alertEngine.ts
 * @description Deterioration alert engine for the SimCerner EMR.
 *
 * Monitors patient vital signs and NEWS2 scores to generate clinical
 * alerts when thresholds are breached. Provides an in-memory alert
 * store with acknowledgement support.
 */

import type { Patient, VitalSign } from '../types/patient';
import type { NEWS2Result, ClinicalRisk } from '../types/news';

// ---------------------------------------------------------------------------
// Alert Types
// ---------------------------------------------------------------------------

/** Severity levels for clinical alerts. */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/** Type/category of a clinical alert. */
export type AlertType =
  | 'vital_out_of_range'
  | 'news_score_elevated'
  | 'news_score_critical'
  | 'deterioration_trend'
  | 'overdue_observation';

/**
 * A single clinical alert raised by the deterioration engine.
 */
export interface Alert {
  /** Unique alert identifier. */
  id: string;

  /** Category of the alert. */
  type: AlertType;

  /** Severity classification. */
  severity: AlertSeverity;

  /** Human-readable alert message. */
  message: string;

  /** ISO-8601 timestamp when the alert was raised. */
  timestamp: string;

  /** Whether the alert has been acknowledged by a clinician. */
  acknowledged: boolean;

  /** MRN of the patient this alert relates to. */
  patientMrn: string;
}

// ---------------------------------------------------------------------------
// Vital Sign Thresholds (for individual parameter alerts)
// ---------------------------------------------------------------------------

/**
 * Thresholds for triggering individual vital sign alerts.
 * These are independent of NEWS2 and represent absolute danger limits.
 */
const VITAL_ALERT_THRESHOLDS: Record<
  string,
  { warningLow?: number; warningHigh?: number; criticalLow?: number; criticalHigh?: number; label: string }
> = {
  hr: { warningLow: 50, warningHigh: 110, criticalLow: 40, criticalHigh: 130, label: 'Heart Rate' },
  rr: { warningLow: 11, warningHigh: 21, criticalLow: 8, criticalHigh: 25, label: 'Respiratory Rate' },
  bp_sys: { warningLow: 100, warningHigh: 180, criticalLow: 90, criticalHigh: 220, label: 'Systolic BP' },
  spo2: { warningLow: 94, criticalLow: 91, label: 'SpO2' },
  temp: { warningLow: 35.5, warningHigh: 38.5, criticalLow: 35.0, criticalHigh: 39.1, label: 'Temperature' },
};

// ---------------------------------------------------------------------------
// Alert Store (in-memory)
// ---------------------------------------------------------------------------

/** In-memory alert collection. */
let alerts: Alert[] = [];

/** Monotonic counter for generating unique alert IDs. */
let alertIdCounter = 0;

/**
 * Generate a unique alert ID.
 * @returns A prefixed string ID like "ALT-0001".
 */
function generateAlertId(): string {
  alertIdCounter += 1;
  return `ALT-${String(alertIdCounter).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check a patient's latest vital signs against absolute thresholds
 * and return any alerts that should be raised.
 *
 * @param patient - The patient whose vitals are being checked.
 * @param vital   - The vital sign observation to evaluate.
 * @returns Array of newly generated alerts (may be empty).
 */
export function checkVitals(patient: Patient, vital: VitalSign): Alert[] {
  const newAlerts: Alert[] = [];
  const now = new Date().toISOString();

  for (const [key, thresholds] of Object.entries(VITAL_ALERT_THRESHOLDS)) {
    const value = vital[key as keyof VitalSign] as number | undefined;
    if (value == null) continue;

    // Critical range
    if (
      (thresholds.criticalLow != null && value <= thresholds.criticalLow) ||
      (thresholds.criticalHigh != null && value >= thresholds.criticalHigh)
    ) {
      newAlerts.push({
        id: generateAlertId(),
        type: 'vital_out_of_range',
        severity: 'critical',
        message: `CRITICAL: ${thresholds.label} = ${value} (outside safe range)`,
        timestamp: now,
        acknowledged: false,
        patientMrn: patient.mrn,
      });
      continue;
    }

    // Warning range
    if (
      (thresholds.warningLow != null && value <= thresholds.warningLow) ||
      (thresholds.warningHigh != null && value >= thresholds.warningHigh)
    ) {
      newAlerts.push({
        id: generateAlertId(),
        type: 'vital_out_of_range',
        severity: 'warning',
        message: `WARNING: ${thresholds.label} = ${value} (approaching limits)`,
        timestamp: now,
        acknowledged: false,
        patientMrn: patient.mrn,
      });
    }
  }

  // Persist new alerts
  alerts = [...alerts, ...newAlerts];
  return newAlerts;
}

/**
 * Check a NEWS2 result against escalation thresholds and return
 * any alerts that should be raised.
 *
 * @param score      - The calculated NEWS2 result.
 * @param patientMrn - MRN of the patient being evaluated.
 * @returns Array of newly generated alerts (may be empty).
 */
export function checkNEWSScore(score: NEWS2Result, patientMrn: string): Alert[] {
  const newAlerts: Alert[] = [];
  const now = new Date().toISOString();
  const riskMap: Record<ClinicalRisk, { severity: AlertSeverity; type: AlertType } | null> = {
    Low: null,
    'Low-Medium': { severity: 'info', type: 'news_score_elevated' },
    Medium: { severity: 'warning', type: 'news_score_elevated' },
    High: { severity: 'critical', type: 'news_score_critical' },
  };

  const config = riskMap[score.clinicalRisk];
  if (config) {
    newAlerts.push({
      id: generateAlertId(),
      type: config.type,
      severity: config.severity,
      message: `NEWS2 Score ${score.totalScore} — ${score.clinicalRisk} risk. Escalation level ${score.escalationLevel}.`,
      timestamp: now,
      acknowledged: false,
      patientMrn,
    });
  }

  // Check for any individual "3" (red) sub-scores
  const redParams = score.subScores.filter((s) => s.score === 3);
  if (redParams.length > 0 && score.clinicalRisk !== 'High') {
    newAlerts.push({
      id: generateAlertId(),
      type: 'news_score_elevated',
      severity: 'warning',
      message: `RED score in: ${redParams.map((p) => p.parameter).join(', ')}. Requires increased monitoring.`,
      timestamp: now,
      acknowledged: false,
      patientMrn,
    });
  }

  alerts = [...alerts, ...newAlerts];
  return newAlerts;
}

/**
 * Acknowledge an alert by its ID, marking it as clinician-reviewed.
 *
 * @param alertId - The alert ID to acknowledge.
 */
export function acknowledgeAlert(alertId: string): void {
  alerts = alerts.map((a) =>
    a.id === alertId ? { ...a, acknowledged: true } : a,
  );
}

/**
 * Retrieve all currently active (unacknowledged) alerts.
 *
 * @returns Array of unacknowledged alerts, newest first.
 */
export function getActiveAlerts(): Alert[] {
  return alerts
    .filter((a) => !a.acknowledged)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Retrieve all alerts (including acknowledged).
 *
 * @returns Full alert history, newest first.
 */
export function getAllAlerts(): Alert[] {
  return [...alerts].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Clear all alerts. Useful for resetting the simulation.
 */
export function clearAlerts(): void {
  alerts = [];
  alertIdCounter = 0;
}
