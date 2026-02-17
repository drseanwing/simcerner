/**
 * @file PatientBanner.tsx
 * @description Patient demographic banner displayed below the top nav.
 *
 * Migrated from the PatientBanner section of emr-sim-v2.html. Shows the
 * patient's name, MRN (formatted as URN-PAH), DOB, age, allergies on the
 * left side, and admission date, location, and attending clinician on the
 * right side.
 */

import type { Patient } from '../../types';
import '../../styles/components/layout.css';

/** Props accepted by PatientBanner. */
interface PatientBannerProps {
  /** The currently selected patient record. */
  patient: Patient;
}

/**
 * Formats the MRN for display by prepending "URN-PAH" if not already present.
 * Mirrors the original emr-sim-v2.html display convention.
 */
function formatMRN(mrn: string): string {
  if (mrn.startsWith('PAH')) {
    return `URN-${mrn}`;
  }
  return mrn;
}

/**
 * Formats allergy list for display. Returns "NKDA" if no allergies,
 * otherwise joins them with commas.
 */
function formatAllergies(allergies: string[]): { text: string; hasAllergies: boolean } {
  if (!allergies || allergies.length === 0) {
    return { text: 'NKDA (No Known Drug Allergies)', hasAllergies: false };
  }
  return { text: `Allergies: ${allergies.join(', ')}`, hasAllergies: true };
}

/**
 * PatientBanner displays key patient identification and admission information
 * in a prominent strip below the top navigation bar.
 */
export default function PatientBanner({ patient }: PatientBannerProps) {
  const allergyInfo = formatAllergies(patient.allergies);

  return (
    <div className="patient-banner">
      {/* Left: Identity & Demographics */}
      <div className="patient-banner-left">
        <div className="patient-banner-name">{patient.name}</div>
        <div className="patient-banner-details">
          <span className="patient-banner-detail">
            <span className="patient-banner-detail-label">MRN:</span>
            <span>{formatMRN(patient.mrn)}</span>
          </span>
          <span className="patient-banner-detail">
            <span className="patient-banner-detail-label">DOB:</span>
            <span>{patient.dob}</span>
          </span>
          <span className="patient-banner-detail">
            <span className="patient-banner-detail-label">Age:</span>
            <span>{patient.age} yrs</span>
          </span>
          <span className="patient-banner-detail">
            <span className="patient-banner-detail-label">Gender:</span>
            <span>{patient.gender}</span>
          </span>
        </div>
        <div
          className={
            allergyInfo.hasAllergies
              ? 'patient-banner-allergies'
              : 'patient-banner-allergies patient-banner-allergies--nkda'
          }
        >
          {allergyInfo.text}
        </div>
      </div>

      {/* Right: Admission & Location */}
      <div className="patient-banner-right">
        <div className="patient-banner-right-item">
          <span className="patient-banner-detail-label">Admitted:</span>
          <span>{patient.admission}</span>
        </div>
        <div className="patient-banner-right-item">
          <span className="patient-banner-detail-label">Location:</span>
          <span>{patient.location}</span>
        </div>
        <div className="patient-banner-right-item">
          <span className="patient-banner-detail-label">Attending:</span>
          <span>{patient.attending}</span>
        </div>
      </div>
    </div>
  );
}
