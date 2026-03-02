import type { Patient } from '@/types/patient'

interface MARViewProps {
  patient: Patient
}

export function MARView({ patient }: MARViewProps) {
  return (
    <>
      <div className="content-header">
        {'\uD83D\uDC8A'} Medication Administration Record
      </div>
      <div className="content-tabs">
        <div className="content-tab active">All Medications (System)</div>
      </div>
      <div className="content-body">
        {patient.medications.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dose</th>
                <th>Route</th>
                <th>Frequency</th>
                <th>Schedule</th>
                <th>Last Given</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {patient.medications.map((med, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{med.name}</td>
                  <td>{med.dose}</td>
                  <td>{med.route}</td>
                  <td>{med.frequency}</td>
                  <td>{med.scheduled ? med.times.join(', ') : 'PRN'}</td>
                  <td>{med.lastGiven || '-'}</td>
                  <td>
                    <span className="text-success">{'\u25CF'} Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div
            className="text-muted"
            style={{ padding: '20px', textAlign: 'center' }}
          >
            No medications prescribed
          </div>
        )}
      </div>
    </>
  )
}
