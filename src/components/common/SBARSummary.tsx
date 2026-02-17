/**
 * @file SBARSummary.tsx
 * @description Auto-generated SBAR (Situation, Background, Assessment,
 * Recommendation) clinical handover summary.
 *
 * Takes patient data and generates a structured handover summary following
 * the SBAR communication framework used in clinical practice. Can be
 * rendered as a modal overlay or as a full view in the sidebar.
 */

import { useState, useMemo, useCallback, useRef } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import { useClockStore } from '../../stores/clockStore';
import { calculateNEWS2, getEscalationRecommendation } from '../../services/newsCalculator';
import type { Patient, VitalSign, LabResult } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function formatDateTime(d: Date): string {
  return `${pad2(d.getDate())}-${MONTHS[d.getMonth()]}-${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatVitalValue(label: string, value: number | string | undefined, unit: string): string {
  if (value == null) return '';
  return `${label}: ${value}${unit}`;
}

/** Collect abnormal lab results across all categories. */
function getAbnormalLabs(patient: Patient): LabResult[] {
  const abnormal: LabResult[] = [];
  const categories = patient.results;
  for (const key of Object.keys(categories) as (keyof typeof categories)[]) {
    for (const result of categories[key]) {
      if (result.flag && result.flag !== 'normal') {
        abnormal.push(result);
      }
    }
  }
  return abnormal;
}

/** Build the latest vitals summary string. */
function formatVitals(vital: VitalSign): string {
  const parts = [
    formatVitalValue('HR', vital.hr, ' bpm'),
    formatVitalValue('BP', vital.bp_sys != null && vital.bp_dia != null
      ? `${vital.bp_sys}/${vital.bp_dia}`
      : vital.bp_sys, ' mmHg'),
    formatVitalValue('RR', vital.rr, '/min'),
    formatVitalValue('SpO2', vital.spo2, '%'),
    formatVitalValue('Temp', vital.temp, '°C'),
    vital.avpu ? `AVPU: ${vital.avpu}` : '',
  ].filter(Boolean);
  return parts.join(' | ');
}

// ---------------------------------------------------------------------------
// SBAR Generator
// ---------------------------------------------------------------------------

interface SBARData {
  situation: string[];
  background: string[];
  assessment: string[];
  recommendation: string[];
  generatedAt: string;
}

function generateSBAR(patient: Patient, simTime: Date): SBARData {
  const generatedAt = formatDateTime(simTime);

  // -- Situation --
  const situation: string[] = [
    `Patient: ${patient.name}, ${patient.age} year old ${patient.gender}`,
    `MRN: ${patient.mrn}`,
    `Location: ${patient.location}`,
    `Attending: ${patient.attending}`,
    `Admitted: ${patient.admission}`,
  ];

  // -- Background --
  const background: string[] = [];
  if (patient.medicalHistory.length > 0) {
    background.push(`Medical History: ${patient.medicalHistory.join(', ')}`);
  } else {
    background.push('Medical History: Nil significant');
  }

  if (patient.allergies.length > 0) {
    background.push(`Allergies: ${patient.allergies.join(', ')}`);
  } else {
    background.push('Allergies: NKDA');
  }

  const activeMeds = patient.medications.filter((m) => m.status === 'active');
  if (activeMeds.length > 0) {
    background.push(
      `Current Medications (${activeMeds.length}): ${activeMeds.map((m) => `${m.name} ${m.dose} ${m.route} ${m.frequency}`).join('; ')}`,
    );
  } else {
    background.push('Current Medications: Nil regular');
  }

  const recentNotes = patient.notes
    .filter((n) => n.type === 'Admission' || n.type === 'Progress')
    .slice(-2);
  if (recentNotes.length > 0) {
    background.push('Recent Notes:');
    for (const note of recentNotes) {
      background.push(`  - ${note.title} (${note.author}, ${note.datetime})`);
    }
  }

  // -- Assessment --
  const assessment: string[] = [];
  const latestVital = patient.vitals.length > 0
    ? patient.vitals[patient.vitals.length - 1]
    : undefined;

  if (latestVital) {
    assessment.push(`Latest Vitals (${latestVital.datetime}):`);
    assessment.push(`  ${formatVitals(latestVital)}`);

    const news2 = calculateNEWS2(latestVital);
    assessment.push(`NEWS2 Score: ${news2.totalScore} — Clinical Risk: ${news2.clinicalRisk}`);

    if (latestVital.supplementalO2) {
      assessment.push('  Patient on supplemental oxygen');
    }
  } else {
    assessment.push('Latest Vitals: No observations recorded');
  }

  const abnormalLabs = getAbnormalLabs(patient);
  if (abnormalLabs.length > 0) {
    assessment.push(`Abnormal Results (${abnormalLabs.length}):`);
    for (const lab of abnormalLabs.slice(0, 8)) {
      const flag = lab.flag === 'HH' || lab.flag === 'LL' ? `**${lab.flag}**` : lab.flag;
      assessment.push(`  - ${lab.test}: ${lab.value} ${lab.unit} [${flag}] (ref: ${lab.range ?? lab.normalRange ?? 'N/A'})`);
    }
    if (abnormalLabs.length > 8) {
      assessment.push(`  ... and ${abnormalLabs.length - 8} more abnormal results`);
    }
  }

  // -- Recommendation --
  const recommendation: string[] = [];

  if (latestVital) {
    const news2 = calculateNEWS2(latestVital);
    const escalation = getEscalationRecommendation(news2.clinicalRisk);
    recommendation.push(`NEWS2 Escalation: ${escalation}`);
  }

  const pendingOrders = patient.orders.filter(
    (o) => o.status === 'Ordered' || o.status === 'Pending' || o.status === 'In Progress',
  );
  if (pendingOrders.length > 0) {
    recommendation.push(`Pending Orders (${pendingOrders.length}):`);
    for (const order of pendingOrders) {
      recommendation.push(`  - ${order.name} (${order.priority}) — ${order.status}`);
    }
  }

  const dueMeds = patient.medications.filter((m) => m.status === 'active' && m.scheduled);
  if (dueMeds.length > 0) {
    recommendation.push(`Scheduled Medications Due:`);
    for (const med of dueMeds) {
      recommendation.push(`  - ${med.name} ${med.dose} ${med.route} (${med.frequency}) — times: ${med.times.join(', ')}`);
    }
  }

  if (recommendation.length === 0) {
    recommendation.push('Continue current management plan. Review in line with clinical protocol.');
  }

  return { situation, background, assessment, recommendation, generatedAt };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SBARSection({
  letter,
  title,
  items,
  colour,
}: {
  letter: string;
  title: string;
  items: string[];
  colour: string;
}) {
  return (
    <div className="sbar__section">
      <div className="sbar__section-header" style={{ borderLeftColor: colour }}>
        <span className="sbar__letter" style={{ backgroundColor: colour }}>{letter}</span>
        <span className="sbar__title">{title}</span>
      </div>
      <div className="sbar__section-body">
        {items.map((item, i) => (
          <div key={i} className="sbar__item">{item}</div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/** Props for SBARSummary when used as a modal trigger. */
interface SBARSummaryProps {
  /** Whether to render as a full view (in sidebar) vs modal button. */
  asView?: boolean;
}

/**
 * SBARSummary auto-generates a clinical handover summary from patient data.
 *
 * When `asView` is true, renders the full summary inline (for the sidebar view).
 * When `asView` is false/undefined, renders a "Generate SBAR" button that
 * opens a modal overlay.
 */
export default function SBARSummary({ asView = false }: SBARSummaryProps) {
  const patient = usePatientStore((s) => s.currentPatient);
  const simTime = useClockStore((s) => s.currentTime);
  const [showModal, setShowModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const sbar = useMemo(() => {
    if (!patient) return null;
    return generateSBAR(patient, simTime);
  }, [patient, simTime]);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>SBAR Handover - ${patient?.name ?? 'Patient'}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; font-size: 12px; }
        .sbar__section { margin-bottom: 16px; }
        .sbar__section-header { font-weight: 700; font-size: 14px; margin-bottom: 6px; padding: 4px 8px; border-left: 4px solid #333; background: #f5f5f5; }
        .sbar__letter { display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; color: white; border-radius: 3px; margin-right: 8px; font-size: 13px; }
        .sbar__item { padding: 2px 0 2px 12px; white-space: pre-wrap; }
        .sbar__meta { color: #666; font-size: 11px; margin-bottom: 12px; }
        h2 { margin: 0 0 4px 0; }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [patient?.name]);

  if (!patient || !sbar) {
    if (asView) {
      return (
        <>
          <div className="content-header"><h2>Handover Summary (SBAR)</h2></div>
          <div className="content-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            No patient selected
          </div>
        </>
      );
    }
    return null;
  }

  const sbarContent = (
    <div ref={printRef} className="sbar">
      <div className="sbar__header-block">
        <h2 className="sbar__main-title">SBAR Clinical Handover</h2>
        <div className="sbar__meta">
          Generated: {sbar.generatedAt} | Patient: {patient.name} | MRN: {patient.mrn}
        </div>
      </div>

      <SBARSection letter="S" title="Situation" items={sbar.situation} colour="#0066b2" />
      <SBARSection letter="B" title="Background" items={sbar.background} colour="#5cb85c" />
      <SBARSection letter="A" title="Assessment" items={sbar.assessment} colour="#f0ad4e" />
      <SBARSection letter="R" title="Recommendation" items={sbar.recommendation} colour="#d9534f" />
    </div>
  );

  // Full view mode (sidebar)
  if (asView) {
    return (
      <>
        <div className="content-header">
          <h2>Handover Summary (SBAR)</h2>
          <button className="btn btn-primary btn-sm" onClick={handlePrint} type="button">
            Print
          </button>
        </div>
        <div className="content-body">
          {sbarContent}
        </div>
      </>
    );
  }

  // Modal trigger mode
  return (
    <>
      <button
        className="btn btn-primary btn-sm"
        onClick={() => setShowModal(true)}
        type="button"
      >
        Generate SBAR
      </button>

      {showModal && (
        <div className="sbar-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="sbar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sbar-modal__header">
              <h3>SBAR Clinical Handover</h3>
              <div className="sbar-modal__actions">
                <button className="btn btn-primary btn-sm" onClick={handlePrint} type="button">
                  Print
                </button>
                <button className="btn btn-sm" onClick={() => setShowModal(false)} type="button">
                  Close
                </button>
              </div>
            </div>
            <div className="sbar-modal__body">
              {sbarContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
