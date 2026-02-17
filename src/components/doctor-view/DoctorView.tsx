/**
 * @file DoctorView.tsx
 * @description Doctor View — the default landing view when a patient chart is opened.
 *
 * Displays a summary of the patient's clinical status including:
 * - EW Score Table: grid of the 3 most recent vital sign observations
 * - NEWS2 aggregate score (when vital data is available)
 * - Recent Clinical Notes: expandable note items (first 3 notes)
 *
 * Migrated from the DoctorView component in emr-sim-v2.html with
 * full TypeScript typing and Zustand store integration.
 */

import { useState, useMemo } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import { calculateNEWS2 } from '../../services/newsCalculator';
import type { VitalSign, ClinicalNote, NEWS2Result } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of recent vital sign columns to display. */
const MAX_VITALS_COLUMNS = 3;

/** Maximum number of recent clinical notes to display. */
const MAX_NOTES = 3;

/** Vital sign parameters displayed in the EW Score Table. */
const EW_PARAMETERS: Array<{
  label: string;
  render: (v: VitalSign) => string;
}> = [
  { label: 'Temperature', render: (v) => (v.temp != null ? `${v.temp}°C` : '—') },
  { label: 'Heart Rate', render: (v) => (v.hr != null ? `${v.hr} bpm` : '—') },
  { label: 'Resp Rate', render: (v) => (v.rr != null ? `${v.rr} /min` : '—') },
  {
    label: 'Blood Pressure',
    render: (v) =>
      v.bp_sys != null && v.bp_dia != null ? `${v.bp_sys}/${v.bp_dia}` : '—',
  },
  { label: 'SpO2', render: (v) => (v.spo2 != null ? `${v.spo2}%` : '—') },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DoctorView renders the clinician summary page for the currently
 * selected patient, showing vital signs at a glance and recent notes.
 */
export default function DoctorView() {
  const patient = usePatientStore((s) => s.currentPatient);
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  /** Compute NEWS2 score from the most recent vital sign observation. */
  const latestNews: NEWS2Result | null = useMemo(() => {
    if (!patient?.vitals?.length) return null;
    return calculateNEWS2(patient.vitals[0]);
  }, [patient?.vitals]);

  if (!patient) {
    return <div className="text-muted" style={{ padding: 20 }}>No patient selected</div>;
  }

  const recentVitals = patient.vitals.slice(0, MAX_VITALS_COLUMNS);
  const recentNotes = patient.notes.slice(0, MAX_NOTES);

  return (
    <>
      <div className="content-header">Doctor View</div>
      <div className="content-body">
        {/* ---- EW Score Table ---- */}
        <div className="vitals-chart mb-10">
          <div className="chart-header">EW Score Table</div>

          {recentVitals.length > 0 ? (
            <div
              className="chart-grid"
              style={{
                gridTemplateColumns: `120px repeat(${recentVitals.length}, 1fr)`,
              }}
            >
              {/* Header row: parameter label + date/time columns */}
              <div className="chart-cell header">Parameter</div>
              {recentVitals.map((v, i) => (
                <div key={i} className="chart-cell header">
                  {v.datetime}
                </div>
              ))}

              {/* Parameter rows */}
              {EW_PARAMETERS.map((param) => (
                <EWRow
                  key={param.label}
                  label={param.label}
                  vitals={recentVitals}
                  render={param.render}
                />
              ))}

              {/* NEWS2 score row */}
              {latestNews && (
                <>
                  <div className="chart-cell label">NEWS2 Score</div>
                  {recentVitals.map((v, i) => {
                    const result = calculateNEWS2(v);
                    return (
                      <div
                        key={i}
                        className={`chart-cell${result.totalScore >= 7 ? ' abnormal' : ''}`}
                      >
                        {result.totalScore} ({result.clinicalRisk})
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ) : (
            <div className="text-muted" style={{ padding: 10 }}>
              No vital signs recorded
            </div>
          )}
        </div>

        {/* ---- Recent Clinical Notes ---- */}
        <div className="vitals-chart mb-10">
          <div className="chart-header">Recent Clinical Notes</div>
          <div className="notes-list">
            {recentNotes.length > 0 ? (
              recentNotes.map((note) => (
                <NoteItem
                  key={note.id}
                  note={note}
                  isExpanded={expandedNoteId === note.id}
                  onToggle={() =>
                    setExpandedNoteId(expandedNoteId === note.id ? null : note.id)
                  }
                />
              ))
            ) : (
              <div className="text-muted" style={{ padding: 10 }}>
                No clinical notes available
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** A single row in the EW Score Table grid. */
function EWRow({
  label,
  vitals,
  render,
}: {
  label: string;
  vitals: VitalSign[];
  render: (v: VitalSign) => string;
}) {
  return (
    <>
      <div className="chart-cell label">{label}</div>
      {vitals.map((v, i) => (
        <div key={i} className="chart-cell">
          {render(v)}
        </div>
      ))}
    </>
  );
}

/** An expandable clinical note item. */
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
            {note.author} - {note.datetime}
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
