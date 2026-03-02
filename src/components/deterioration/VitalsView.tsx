import type { Patient } from '@/types/patient'

interface VitalsViewProps {
  patient: Patient
}

export function VitalsView({ patient }: VitalsViewProps) {
  return (
    <>
      <div className="content-header">
        {'\uD83D\uDCCA'} Managing Deterioration - Vital Signs
      </div>
      <div className="content-body">
        <div className="vitals-chart">
          <div className="chart-header">Vital Signs Flow Sheet</div>
          {patient.vitals.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Temp (&deg;C)</th>
                  <th>HR (bpm)</th>
                  <th>RR (/min)</th>
                  <th>BP (mmHg)</th>
                  <th>SpO{'\u2082'} (%)</th>
                  <th>AVPU</th>
                </tr>
              </thead>
              <tbody>
                {patient.vitals.map((vital, idx) => (
                  <tr key={idx}>
                    <td>{vital.datetime}</td>
                    <td>{vital.temp}</td>
                    <td>{vital.hr}</td>
                    <td>{vital.rr}</td>
                    <td>
                      {vital.bp_sys}/{vital.bp_dia}
                    </td>
                    <td>{vital.spo2}</td>
                    <td>{vital.avpu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div
              className="text-muted"
              style={{ padding: '20px', textAlign: 'center' }}
            >
              No vital signs recorded
            </div>
          )}
        </div>
      </div>
    </>
  )
}
