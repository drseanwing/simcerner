/**
 * @file PatientBanner.tsx
 * @description Patient demographic banner displayed below the top nav.
 *
 * Migrated from the PatientBanner section of emr-sim-v2.html. Shows the
 * patient's name, MRN (formatted as URN-PAH), DOB, age on the left side,
 * admission date, location, and attending clinician on the right side,
 * and an integrated AllergyBanner strip beneath.
 */

import type { Patient } from '../../types';
import AllergyBanner from '../common/AllergyBanner';
import '../../styles/components/layout.css';

/** Props accepted by PatientBanner. */
interface PatientBannerProps {
  /** The currently selected patient record. */
  patient: Patient;
  /** Optional active drug-allergy interaction alerts. */
  activeAlerts?: string[];
}

/**
 * Formats the MRN for display by prepending "URN-PAH" if not already present.
 */
function formatMRN(mrn: string): string {
  if (mrn.startsWith('PAH')) {
    return `URN-${mrn}`;
  }
  return mrn;
}

/**
 * PatientBanner displays key patient identification and admission information
 * in a prominent strip below the top navigation bar, with an integrated
 * allergy banner showing colour-coded allergy status.
 */
export default function PatientBanner({ patient, activeAlerts }: PatientBannerProps) {
  return (
    <div className="patient-banner-wrapper">
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

      {/* Allergy Banner */}
      <AllergyBanner
        allergies={patient.allergies}
        activeAlerts={activeAlerts}
      />
    </div>
  );
}
