import type { Patient } from '@/types/patient'

interface PatientBannerProps {
  patient: Patient
}

export function PatientBanner({ patient }: PatientBannerProps) {
  return (
    <div className="patient-banner">
      <div className="patient-banner-left">
        <div className="patient-name">{patient.name}</div>
        <div className="patient-detail">
          <div className="patient-detail-item">
            <span className="patient-detail-label">URN-PAH:</span>
            <span>{patient.mrn}</span>
          </div>
          <div className="patient-detail-item">
            <span className="patient-detail-label">DOB:</span>
            <span>{patient.dob}</span>
          </div>
          <div className="patient-detail-item">
            <span className="patient-detail-label">{patient.age}</span>
          </div>
        </div>
        <div className="patient-detail">
          <div className="patient-detail-item">
            <span className="patient-detail-label">Allergies:</span>
            <span>{patient.allergies}</span>
          </div>
        </div>
      </div>
      <div className="patient-banner-right">
        {patient.admission && (
          <>
            <div className="patient-detail">
              <div className="patient-detail-item">
                <span className="patient-detail-label">Inpatient</span>
                <span>[{patient.admission}]</span>
              </div>
            </div>
            <div className="patient-detail">
              <div className="patient-detail-item">
                <span className="patient-detail-label">Location:</span>
                <span>{patient.location}</span>
              </div>
            </div>
            <div className="patient-detail">
              <div className="patient-detail-item">
                <span className="patient-detail-label">Attending Clinician:</span>
                <span>{patient.attending}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
