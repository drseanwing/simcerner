/**
 * @file DocumentationView.tsx
 * @description Clinical documentation view migrated from emr-sim-v2.html.
 *
 * Displays a chronological list of clinical notes with expand/collapse
 * functionality. Each note shows title, author, datetime, type, and
 * content when expanded.
 */

import { useState } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import type { ClinicalNote } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DocumentationView renders the clinical notes for the current patient
 * with expandable note items showing full content when clicked.
 */
export default function DocumentationView() {
  const patient = usePatientStore((s) => s.currentPatient);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  if (!patient) {
    return (
      <div className="text-muted" style={{ padding: 20 }}>
        No patient selected
      </div>
    );
  }

  const toggleNote = (noteId: string) => {
    setExpandedNoteId(expandedNoteId === noteId ? null : noteId);
  };

  return (
    <>
      <div className="content-header">Documentation</div>
      <div className="content-tabs">
        <div className="content-tab active">All</div>
      </div>
      <div className="content-body">
        <div className="notes-list">
          {patient.notes.length > 0 ? (
            patient.notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isExpanded={expandedNoteId === note.id}
                onToggle={() => toggleNote(note.id)}
              />
            ))
          ) : (
            <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
              No clinical documentation available
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * NoteItem renders a single expandable clinical note.
 */
function NoteItem({
  note,
  isExpanded,
  onToggle,
}: {
  note: ClinicalNote;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="note-item">
      <div className="note-header" onClick={onToggle}>
        <div>
          <div className="note-title">{note.title}</div>
          <div className="note-meta">
            {note.type} | {note.author} | {note.datetime}
          </div>
        </div>
        <div>{isExpanded ? '▼' : '▶'}</div>
      </div>
      <div className={`note-body${isExpanded ? '' : ' collapsed'}`}>
        {note.content}
      </div>
    </div>
  );
}
