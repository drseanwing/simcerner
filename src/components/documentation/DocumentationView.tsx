import { useState } from 'react'
import type { Patient } from '@/types/patient'

interface DocumentationViewProps {
  patient: Patient
}

export function DocumentationView({ patient }: DocumentationViewProps) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null)

  return (
    <>
      <div className="content-header">{'\uD83D\uDCDD'} Documentation</div>
      <div className="content-tabs">
        <div className="content-tab active">All</div>
      </div>
      <div className="content-body">
        <div className="notes-list">
          {patient.notes.length > 0 ? (
            patient.notes.map((note) => (
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
                      {note.type} | {note.author} | {note.datetime}
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
            <div
              className="text-muted"
              style={{ padding: '20px', textAlign: 'center' }}
            >
              No clinical documentation available
            </div>
          )}
        </div>
      </div>
    </>
  )
}
