/**
 * @file InteractiveView.tsx
 * @description Main Interactive View (iView) component for the SimCerner EMR.
 *
 * Composes the NavigatorPanel, IViewToolbar, FlowsheetSection, and
 * AssessmentForm into Cerner's iView clinical documentation interface.
 * Manages all iView state including band/section selection, time
 * interval, assessment entries, and form visibility.
 *
 * Layout:
 * ```
 * ┌──────────────────────────────────────────────────────────────┐
 * │ content-header: Interactive View (iView)                     │
 * ├──────────────────────────────────────────────────────────────┤
 * │ IViewToolbar: [Sign] [Refresh] [1hr|2hr|4hr] [☐ Empty]     │
 * ├────────────┬─────────────────────────────────────────────────┤
 * │ Navigator  │ FlowsheetSection                               │
 * │ Panel      │ (time-columned grid for selected section)      │
 * └────────────┴─────────────────────────────────────────────────┘
 * ```
 *
 * @see NavigatorPanel
 * @see IViewToolbar
 * @see FlowsheetSection
 * @see AssessmentForm
 */

import { useState, useCallback, useMemo } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import type {
  IViewBand,
  IViewSection,
  AssessmentEntry,
  TimeInterval,
  AssessmentParameter,
} from '../../types/iview';
import NavigatorPanel from './NavigatorPanel';
import IViewToolbar from './IViewToolbar';
import FlowsheetSection from './FlowsheetSection';
import AssessmentForm from './AssessmentForm';
import '../../styles/components/iview.css';

// ---------------------------------------------------------------------------
// Default band/section definitions
// ---------------------------------------------------------------------------

/** Build the default navigator band structure with all sections. */
function createDefaultBands(): IViewBand[] {
  return [
    {
      id: 'med-surg',
      name: 'Med Surg',
      icon: '🏥',
      expanded: true,
      documented: false,
      sections: [
        {
          id: 'vital-signs',
          name: 'Vital Signs',
          parameters: [
            { id: 'temp', label: 'Temperature', type: 'number', unit: '°C', normalRange: { min: 36.1, max: 38.0 } },
            { id: 'hr', label: 'Heart Rate', type: 'number', unit: 'bpm', normalRange: { min: 51, max: 90 } },
            { id: 'rr', label: 'Respiratory Rate', type: 'number', unit: 'breaths/min', normalRange: { min: 12, max: 20 } },
            { id: 'bp_sys', label: 'Blood Pressure', type: 'text', unit: 'mmHg' },
            { id: 'spo2', label: 'SpO2', type: 'number', unit: '%', normalRange: { min: 96, max: 100 } },
            { id: 'avpu', label: 'AVPU', type: 'select', options: ['A', 'V', 'P', 'U'] },
            { id: 'supplementalO2', label: 'Supplemental O2', type: 'checkbox' },
            { id: 'painScore', label: 'Pain Score', type: 'number', unit: '/10', normalRange: { min: 0, max: 3 } },
          ],
        },
        {
          id: 'pain-assessment',
          name: 'Pain Assessment',
          parameters: [
            { id: 'pain-location', label: 'Pain Location', type: 'text' },
            { id: 'pain-character', label: 'Pain Character', type: 'select', options: ['Sharp', 'Dull', 'Burning', 'Aching', 'Stabbing', 'Throbbing', 'Cramping'] },
            { id: 'pain-severity', label: 'Pain Severity (0-10)', type: 'number', unit: '/10', normalRange: { min: 0, max: 3 } },
            { id: 'pain-onset', label: 'Onset', type: 'select', options: ['New', 'Chronic', 'Worsening', 'Improving', 'Unchanged'] },
            { id: 'pain-intervention', label: 'Intervention', type: 'textarea' },
            { id: 'pain-reassessment', label: 'Post-intervention Score', type: 'number', unit: '/10', normalRange: { min: 0, max: 3 } },
          ],
        },
        {
          id: 'fall-risk',
          name: 'Fall Risk',
          parameters: [
            { id: 'fall-history', label: 'History of Falls', type: 'select', options: ['No', 'Yes - within 3 months', 'Yes - older than 3 months'] },
            { id: 'fall-gait', label: 'Gait/Balance', type: 'select', options: ['Normal', 'Unsteady', 'Requires assistance', 'Immobile'] },
            { id: 'fall-medications', label: 'High-risk Medications', type: 'checkbox' },
            { id: 'fall-iv', label: 'IV Access/Infusion', type: 'checkbox' },
            { id: 'fall-mental', label: 'Mental Status', type: 'select', options: ['Oriented', 'Confused', 'Agitated', 'Forgetful'] },
            { id: 'fall-interventions', label: 'Interventions', type: 'textarea' },
          ],
        },
        {
          id: 'skin-wound',
          name: 'Skin/Wound',
          parameters: [
            { id: 'skin-colour', label: 'Skin Colour', type: 'select', options: ['Normal', 'Pale', 'Flushed', 'Cyanotic', 'Jaundiced', 'Mottled'] },
            { id: 'skin-integrity', label: 'Skin Integrity', type: 'select', options: ['Intact', 'Pressure area', 'Wound', 'Bruising', 'Oedema'] },
            { id: 'skin-turgor', label: 'Turgor', type: 'select', options: ['Normal', 'Reduced', 'Poor'] },
            { id: 'wound-location', label: 'Wound Location', type: 'text' },
            { id: 'wound-type', label: 'Wound Type', type: 'select', options: ['Surgical', 'Pressure', 'Traumatic', 'Venous', 'Arterial', 'Diabetic'] },
            { id: 'wound-notes', label: 'Wound Notes', type: 'textarea' },
          ],
        },
      ],
    },
    {
      id: 'neurological',
      name: 'Neurological',
      icon: '🧠',
      expanded: false,
      documented: false,
      sections: [
        {
          id: 'neuro-assessment',
          name: 'Neurological Assessment',
          parameters: [
            { id: 'neuro-loc', label: 'Level of Consciousness', type: 'select', options: ['Alert', 'Drowsy', 'Confused', 'Obtunded', 'Comatose'] },
            { id: 'neuro-orientation', label: 'Orientation', type: 'select', options: ['Person/Place/Time', 'Person/Place', 'Person only', 'Disoriented'] },
            { id: 'neuro-speech', label: 'Speech', type: 'select', options: ['Clear', 'Slurred', 'Aphasic', 'Dysphagic'] },
            { id: 'neuro-motor', label: 'Motor Response', type: 'select', options: ['Normal', 'Weakness', 'Paralysis'] },
            { id: 'neuro-sensation', label: 'Sensation', type: 'select', options: ['Intact', 'Reduced', 'Absent', 'Paraesthesia'] },
            { id: 'neuro-notes', label: 'Notes', type: 'textarea' },
          ],
        },
        {
          id: 'gcs',
          name: 'GCS',
          parameters: [
            { id: 'gcs-eye', label: 'Eye Opening (E)', type: 'select', options: ['4 - Spontaneous', '3 - To voice', '2 - To pain', '1 - None'] },
            { id: 'gcs-verbal', label: 'Verbal Response (V)', type: 'select', options: ['5 - Oriented', '4 - Confused', '3 - Inappropriate', '2 - Incomprehensible', '1 - None'] },
            { id: 'gcs-motor', label: 'Motor Response (M)', type: 'select', options: ['6 - Obeys', '5 - Localises', '4 - Withdraws', '3 - Flexion', '2 - Extension', '1 - None'] },
          ],
        },
        {
          id: 'pupil-checks',
          name: 'Pupil Checks',
          parameters: [
            { id: 'pupil-left-size', label: 'Left Pupil Size', type: 'number', unit: 'mm', normalRange: { min: 2, max: 5 } },
            { id: 'pupil-left-react', label: 'Left Pupil Reaction', type: 'select', options: ['Brisk', 'Sluggish', 'Fixed'] },
            { id: 'pupil-right-size', label: 'Right Pupil Size', type: 'number', unit: 'mm', normalRange: { min: 2, max: 5 } },
            { id: 'pupil-right-react', label: 'Right Pupil Reaction', type: 'select', options: ['Brisk', 'Sluggish', 'Fixed'] },
            { id: 'pupil-equal', label: 'Pupils Equal', type: 'checkbox' },
          ],
        },
      ],
    },
    {
      id: 'respiratory',
      name: 'Respiratory',
      icon: '🫁',
      expanded: false,
      documented: false,
      sections: [
        {
          id: 'resp-assessment',
          name: 'Respiratory Assessment',
          parameters: [
            { id: 'resp-pattern', label: 'Breathing Pattern', type: 'select', options: ['Regular', 'Irregular', 'Shallow', 'Deep', 'Laboured', 'Kussmaul', 'Cheyne-Stokes'] },
            { id: 'resp-effort', label: 'Work of Breathing', type: 'select', options: ['Normal', 'Mild increase', 'Moderate increase', 'Severe distress'] },
            { id: 'resp-sounds', label: 'Breath Sounds', type: 'select', options: ['Clear', 'Wheeze', 'Crackles', 'Stridor', 'Diminished', 'Absent'] },
            { id: 'resp-cough', label: 'Cough', type: 'select', options: ['None', 'Dry', 'Productive', 'Weak'] },
            { id: 'resp-sputum', label: 'Sputum', type: 'select', options: ['None', 'Clear', 'White', 'Yellow', 'Green', 'Blood-tinged'] },
            { id: 'resp-notes', label: 'Notes', type: 'textarea' },
          ],
        },
        {
          id: 'oxygen-therapy',
          name: 'Oxygen Therapy',
          parameters: [
            { id: 'o2-device', label: 'Delivery Device', type: 'select', options: ['Nasal cannulae', 'Simple mask', 'Venturi mask', 'Non-rebreather', 'CPAP', 'BiPAP', 'High-flow'] },
            { id: 'o2-flow', label: 'Flow Rate', type: 'number', unit: 'L/min' },
            { id: 'o2-fio2', label: 'FiO2', type: 'number', unit: '%' },
            { id: 'o2-target', label: 'Target SpO2', type: 'text' },
          ],
        },
        {
          id: 'airway',
          name: 'Airway',
          parameters: [
            { id: 'airway-status', label: 'Airway Status', type: 'select', options: ['Patent', 'Partially obstructed', 'Obstructed', 'Artificial'] },
            { id: 'airway-type', label: 'Artificial Airway Type', type: 'select', options: ['N/A', 'ETT', 'Tracheostomy', 'LMA'] },
            { id: 'airway-size', label: 'Tube Size', type: 'text' },
            { id: 'airway-cuff', label: 'Cuff Pressure', type: 'number', unit: 'cmH2O' },
          ],
        },
      ],
    },
    {
      id: 'cardiovascular',
      name: 'Cardiovascular',
      icon: '❤️',
      expanded: false,
      documented: false,
      sections: [
        {
          id: 'cvs-assessment',
          name: 'CVS Assessment',
          parameters: [
            { id: 'cvs-rhythm', label: 'Heart Rhythm', type: 'select', options: ['Regular', 'Irregular', 'Atrial Fibrillation', 'Tachycardic', 'Bradycardic'] },
            { id: 'cvs-sounds', label: 'Heart Sounds', type: 'select', options: ['Normal S1 S2', 'Murmur', 'Extra sounds', 'Muffled'] },
            { id: 'cvs-cap-refill', label: 'Capillary Refill', type: 'select', options: ['< 2 seconds', '2-4 seconds', '> 4 seconds'] },
            { id: 'cvs-jvp', label: 'JVP', type: 'select', options: ['Normal', 'Raised', 'Not visible'] },
            { id: 'cvs-oedema', label: 'Peripheral Oedema', type: 'select', options: ['None', 'Trace', 'Mild', 'Moderate', 'Severe'] },
            { id: 'cvs-notes', label: 'Notes', type: 'textarea' },
          ],
        },
        {
          id: 'peripheral-obs',
          name: 'Peripheral Observations',
          parameters: [
            { id: 'periph-colour', label: 'Peripheries Colour', type: 'select', options: ['Pink', 'Pale', 'Cyanotic', 'Mottled'] },
            { id: 'periph-temp', label: 'Peripheries Temp', type: 'select', options: ['Warm', 'Cool', 'Cold'] },
            { id: 'periph-pulses', label: 'Peripheral Pulses', type: 'select', options: ['Present bilaterally', 'Weak', 'Absent'] },
          ],
        },
        {
          id: 'ecg',
          name: 'ECG',
          parameters: [
            { id: 'ecg-rhythm', label: 'Rhythm', type: 'text' },
            { id: 'ecg-rate', label: 'Rate', type: 'number', unit: 'bpm' },
            { id: 'ecg-interpretation', label: 'Interpretation', type: 'textarea' },
          ],
        },
      ],
    },
    {
      id: 'io',
      name: 'I&O',
      icon: '💧',
      expanded: false,
      documented: false,
      sections: [
        {
          id: 'intake',
          name: 'Intake',
          parameters: [
            { id: 'intake-oral', label: 'Oral Intake', type: 'number', unit: 'mL' },
            { id: 'intake-iv', label: 'IV Intake', type: 'number', unit: 'mL' },
            { id: 'intake-other', label: 'Other Intake', type: 'number', unit: 'mL' },
            { id: 'intake-type', label: 'IV Fluid Type', type: 'text' },
          ],
        },
        {
          id: 'output',
          name: 'Output',
          parameters: [
            { id: 'output-urine', label: 'Urine Output', type: 'number', unit: 'mL' },
            { id: 'output-drain', label: 'Drain Output', type: 'number', unit: 'mL' },
            { id: 'output-vomit', label: 'Vomit', type: 'number', unit: 'mL' },
            { id: 'output-other', label: 'Other Output', type: 'number', unit: 'mL' },
          ],
        },
        {
          id: 'fluid-balance-summary',
          name: 'Fluid Balance Summary',
          parameters: [
            { id: 'fb-total-intake', label: 'Total Intake', type: 'number', unit: 'mL' },
            { id: 'fb-total-output', label: 'Total Output', type: 'number', unit: 'mL' },
            { id: 'fb-balance', label: 'Net Balance', type: 'number', unit: 'mL' },
          ],
        },
      ],
    },
    {
      id: 'procedures',
      name: 'Procedures',
      icon: '📋',
      expanded: false,
      documented: false,
      sections: [
        {
          id: 'procedures-list',
          name: 'Procedures',
          parameters: [
            { id: 'proc-name', label: 'Procedure', type: 'text' },
            { id: 'proc-site', label: 'Site', type: 'text' },
            { id: 'proc-outcome', label: 'Outcome', type: 'select', options: ['Successful', 'Partially successful', 'Unsuccessful', 'Abandoned'] },
            { id: 'proc-notes', label: 'Notes', type: 'textarea' },
          ],
        },
        {
          id: 'specimen-collection',
          name: 'Specimen Collection',
          parameters: [
            { id: 'spec-type', label: 'Specimen Type', type: 'select', options: ['Blood', 'Urine', 'Sputum', 'Wound swab', 'CSF', 'Stool', 'Other'] },
            { id: 'spec-site', label: 'Collection Site', type: 'text' },
            { id: 'spec-sent', label: 'Sent to Lab', type: 'checkbox' },
            { id: 'spec-notes', label: 'Notes', type: 'textarea' },
          ],
        },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get a sensible default time range: current day 00:00 to 23:59. */
function getDefaultTimeRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 0, 0);
  return { start, end };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * InteractiveView is the top-level iView component that composes all
 * sub-components into Cerner's clinical documentation tool.
 */
export default function InteractiveView() {
  // -- Patient data from store -----------------------------------------------

  const currentPatient = usePatientStore((s) => s.currentPatient);

  // -- iView state -----------------------------------------------------------

  const [bands, setBands] = useState<IViewBand[]>(createDefaultBands);
  const [activeSectionId, setActiveSectionId] = useState<string | null>('vital-signs');
  const [activeBandId, setActiveBandId] = useState<string | null>('med-surg');
  const [timeInterval, setTimeInterval] = useState<TimeInterval>('2hr');
  const [showEmptyRows, setShowEmptyRows] = useState(true);
  const [entries, setEntries] = useState<AssessmentEntry[]>([]);
  const [signBanner, setSignBanner] = useState(false);

  /** Time range for the flowsheet columns. */
  const timeRange = useMemo(getDefaultTimeRange, []);

  /** Assessment form modal state. */
  const [formState, setFormState] = useState<{
    open: boolean;
    parameterId: string;
    timeSlot: string;
  }>({ open: false, parameterId: '', timeSlot: '' });

  // -- Derived data ----------------------------------------------------------

  /** Find the currently-selected section definition. */
  const activeSection = useMemo<IViewSection | null>(() => {
    if (!activeSectionId) return null;
    for (const band of bands) {
      const found = band.sections.find((s) => s.id === activeSectionId);
      if (found) return found;
    }
    return null;
  }, [bands, activeSectionId]);

  /** Entries for the currently active section. */
  const sectionEntries = useMemo(
    () => entries.filter((e) => e.sectionId === activeSectionId),
    [entries, activeSectionId],
  );

  /** Count of unsigned entries. */
  const unsignedCount = useMemo(
    () => entries.filter((e) => !e.signed).length,
    [entries],
  );

  /** Patient vitals for Vital Signs section pre-population. */
  const patientVitals = currentPatient?.vitals ?? [];

  // -- Callbacks -------------------------------------------------------------

  /** Toggle band expand/collapse. */
  const handleBandToggle = useCallback((bandId: string) => {
    setBands((prev) =>
      prev.map((b) =>
        b.id === bandId ? { ...b, expanded: !b.expanded } : b,
      ),
    );
  }, []);

  /** Select a section to display in the flowsheet. */
  const handleSectionSelect = useCallback((sectionId: string, bandId: string) => {
    setActiveSectionId(sectionId);
    setActiveBandId(bandId);
  }, []);

  /** Open the assessment form for a cell. */
  const handleCellClick = useCallback((parameterId: string, timeSlot: string) => {
    setFormState({ open: true, parameterId, timeSlot });
  }, []);

  /** Save assessment form data. */
  const handleFormSave = useCallback(
    (values: Record<string, string | number | boolean>) => {
      if (!activeSectionId || !activeBandId) return;

      const now = new Date();
      const { timeSlot } = formState;

      const newEntries: AssessmentEntry[] = Object.entries(values).map(
        ([paramId, value]) => ({
          parameterId: paramId,
          sectionId: activeSectionId,
          bandId: activeBandId,
          value,
          timestamp: buildTimestamp(timeSlot, now),
          documentedBy: 'Nurse SimUser',
          signed: false,
        }),
      );

      setEntries((prev) => {
        const filtered = prev.filter(
          (e) =>
            !(
              e.sectionId === activeSectionId &&
              formatTimeFromTimestamp(e.timestamp) === timeSlot &&
              newEntries.some((ne) => ne.parameterId === e.parameterId)
            ),
        );
        return [...filtered, ...newEntries];
      });

      setFormState({ open: false, parameterId: '', timeSlot: '' });
    },
    [activeSectionId, activeBandId, formState],
  );

  /** Close the assessment form. */
  const handleFormClose = useCallback(() => {
    setFormState({ open: false, parameterId: '', timeSlot: '' });
  }, []);

  /** Sign all unsigned entries. */
  const handleSign = useCallback(() => {
    setEntries((prev) => prev.map((e) => ({ ...e, signed: true })));
    setSignBanner(true);
    setTimeout(() => setSignBanner(false), 3000);
  }, []);

  /** Refresh handler (re-initialises time range). */
  const handleRefresh = useCallback(() => {
    // Force re-render with current time context
    setEntries((prev) => [...prev]);
  }, []);

  // -- Render ----------------------------------------------------------------

  /** Get existing entries for the form's time slot. */
  const formExistingEntries = useMemo(() => {
    if (!formState.open || !activeSectionId) return [];
    return entries.filter(
      (e) =>
        e.sectionId === activeSectionId &&
        formatTimeFromTimestamp(e.timestamp) === formState.timeSlot,
    );
  }, [formState, activeSectionId, entries]);

  /** Get the parameters for the form (active section or filtered to clicked param). */
  const formParameters = useMemo<AssessmentParameter[]>(() => {
    if (!activeSection) return [];
    return activeSection.parameters;
  }, [activeSection]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="content-header">
        📋 Interactive View (iView)
        {currentPatient && (
          <span style={{ fontWeight: 400, color: 'var(--cerner-muted)', marginLeft: 'auto' }}>
            {currentPatient.name} — {currentPatient.mrn}
          </span>
        )}
      </div>

      {/* Sign success banner */}
      {signBanner && (
        <div className="iview-sign-banner">
          ✅ All entries signed successfully
        </div>
      )}

      {/* Toolbar */}
      <IViewToolbar
        timeInterval={timeInterval}
        showEmptyRows={showEmptyRows}
        timeRangeStart={timeRange.start}
        timeRangeEnd={timeRange.end}
        unsignedCount={unsignedCount}
        onTimeIntervalChange={setTimeInterval}
        onShowEmptyRowsChange={setShowEmptyRows}
        onSign={handleSign}
        onRefresh={handleRefresh}
      />

      {/* Main content area: navigator + flowsheet */}
      <div className="iview-container">
        <NavigatorPanel
          bands={bands}
          activeSectionId={activeSectionId}
          entries={entries}
          onSectionSelect={handleSectionSelect}
          onBandToggle={handleBandToggle}
        />

        <div className="iview-content">
          <FlowsheetSection
            section={activeSection}
            entries={sectionEntries}
            timeInterval={timeInterval}
            timeRangeStart={timeRange.start}
            timeRangeEnd={timeRange.end}
            showEmptyRows={showEmptyRows}
            vitals={patientVitals}
            onCellClick={handleCellClick}
          />
        </div>
      </div>

      {/* Assessment form modal */}
      {formState.open && activeSection && (
        <AssessmentForm
          sectionName={activeSection.name}
          timestamp={formState.timeSlot}
          parameters={formParameters}
          existingEntries={formExistingEntries}
          onSave={handleFormSave}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Build an ISO timestamp from a time slot string (HH:mm) and a reference date. */
function buildTimestamp(timeSlot: string, ref: Date): string {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const d = new Date(ref);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

/** Extract HH:mm from an ISO timestamp. */
function formatTimeFromTimestamp(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
