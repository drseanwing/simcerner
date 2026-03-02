import { useNavigate } from 'react-router-dom'
import { usePatientStore } from '@/stores/patientStore'
import { useSessionStore } from '@/stores/sessionStore'

export function PatientSearch() {
  const navigate = useNavigate()
  const patients = usePatientStore((s) => s.patients)
  const setCurrentPatient = usePatientStore((s) => s.setCurrentPatient)
  const searchQuery = useSessionStore((s) => s.searchQuery)
  const setSearchQuery = useSessionStore((s) => s.setSearchQuery)

  const filteredPatients = Object.values(patients).filter((p) => {
    const query = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(query) || p.mrn.toLowerCase().includes(query)
    )
  })

  const loadPatient = (mrn: string) => {
    const patient = patients[mrn]
    if (patient) {
      setCurrentPatient(patient)
      navigate('/chart/doctor-view')
    }
  }

  return (
    <div className="patient-search">
      <h2>PowerChart Organizer - Patient Search</h2>
      <input
        type="text"
        className="search-input"
        placeholder="Enter patient name or MRN..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
      />
      <div className="patient-list">
        {filteredPatients.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
            No patients found
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.mrn}
              className="patient-list-item"
              onClick={() => loadPatient(patient.mrn)}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {patient.name}
              </div>
              <div style={{ fontSize: '10px', color: '#666' }}>
                MRN: {patient.mrn} | DOB: {patient.dob} | {patient.gender}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
