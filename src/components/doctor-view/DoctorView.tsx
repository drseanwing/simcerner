import { useState } from 'react'
import type { Patient } from '@/types/patient'

interface DoctorViewProps {
  patient: Patient
}

export function DoctorView({ patient }: DoctorViewProps) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null)

  return (
    <>
      <div className="content-header">{'\uD83C\uDFE0'} Doctor View</div>
      <div className="content-body">
        <div className="vitals-chart mb-10">
          <div className="chart-header">EW Score Table</div>
          {patient.vitals.length > 0 ? (
            <div
              className="chart-grid"
              style={{ gridTemplateColumns: '120px repeat(3, 1fr)' }}
            >
              <div className="chart-cell header">Parameter</div>
              {patient.vitals.slice(0, 3).map((v, i) => (
                <div key={i} className="chart-cell header">
                  {v.datetime}
                </div>
              ))}
              <div className="chart-cell label">Temperature</div>
              {patient.vitals.slice(0, 3).map((v, i) => (
                <div key={i} className="chart-cell">
                  {v.temp}&deg;C
                </div>
              ))}
              <div className="chart-cell label">Heart Rate</div>
              {patient.vitals.slice(0, 3).map((v, i) => (
                <div key={i} className="chart-cell">
                  {v.hr} bpm
                </div>
              ))}
              <div className="chart-cell label">Resp Rate</div>
              {patient.vitals.slice(0, 3).map((v, i) => (
                <div key={i} className="chart-cell">
                  {v.rr} /min
                </div>
              ))}
              <div className="chart-cell label">Blood Pressure</div>
              {patient.vitals.slice(0, 3).map((v, i) => (
                <div key={i} className="chart-cell">
                  {v.bp_sys}/{v.bp_dia}
                </div>
              ))}
              <div className="chart-cell label">SpO2</div>
              {patient.vitals.slice(0, 3).map((v, i) => (
                <div key={i} className="chart-cell">
                  {v.spo2}%
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted" style={{ padding: '10px' }}>
              No vital signs recorded
            </div>
          )}
        </div>
        <div className="vitals-chart mb-10">
          <div className="chart-header">Recent Clinical Notes</div>
          <div className="notes-list">
            {patient.notes.length > 0 ? (
              patient.notes.slice(0, 3).map((note) => (
                <div key={note.id} className="note-item">
                  <div
                    className="note-header"
                    onClick={() =>
                      setExpandedNote(
                        expandedNote === note.id ? null : note.id,
                      )
                    }
                  >
                    <div>
                      <div className="note-title">{note.title}</div>
                      <div className="note-meta">
                        {note.author} - {note.datetime}
                      </div>
                    </div>
                    <div>{expandedNote === note.id ? '\u25BC' : '\u25B6'}</div>
                  </div>
                  <div
                    className={`note-body ${expandedNote === note.id ? '' : 'collapsed'}`}
                  >
                    {note.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted" style={{ padding: '10px' }}>
                No clinical notes available
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
