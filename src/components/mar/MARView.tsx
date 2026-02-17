/**
 * @file MARView.tsx
 * @description Enhanced Medication Administration Record view.
 *
 * Displays medications in two sections:
 * 1. Time-based MAR grid for scheduled medications (via {@link MARGrid})
 * 2. PRN (as-needed) medications in a separate table
 *
 * Falls back to a simple table if patient has basic medication data
 * without time grid scheduling information.
 */

import { usePatientStore } from '../../stores/patientStore';
import type { Medication } from '../../types';
import MARGrid from './MARGrid';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * MARView is the top-level Medication Administration Record screen,
 * composing the time grid for scheduled medications and a PRN section.
 */
export default function MARView() {
  const patient = usePatientStore((s) => s.currentPatient);

  if (!patient) {
    return (
      <div className="text-muted" style={{ padding: 20 }}>
        No patient selected
      </div>
    );
  }

  const medications = patient.medications;

  if (medications.length === 0) {
    return (
      <>
        <div className="content-header">Medication Administration Record</div>
        <div className="content-tabs">
          <div className="content-tab active">All Medications (System)</div>
        </div>
        <div className="content-body">
          <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
            No medications prescribed
          </div>
        </div>
      </>
    );
  }

  const scheduled = medications.filter((m) => m.scheduled);
  const prn = medications.filter((m) => !m.scheduled);
  const hasTimeData = scheduled.some((m) => m.times && m.times.length > 0);

  return (
    <>
      <div className="content-header">Medication Administration Record</div>
      <div className="content-tabs">
        <div className="content-tab active">All Medications (System)</div>
      </div>
      <div className="content-body">
        {/* Time-based grid for scheduled medications */}
        {hasTimeData ? (
          <div className="vitals-chart mb-10">
            <div className="chart-header">Scheduled Medications</div>
            <MARGrid medications={scheduled} />
          </div>
        ) : (
          <div className="vitals-chart mb-10">
            <div className="chart-header">Scheduled Medications</div>
            <SimpleMedTable medications={scheduled} />
          </div>
        )}

        {/* PRN medications section */}
        {prn.length > 0 && (
          <div className="vitals-chart">
            <div className="chart-header">PRN (As Needed) Medications</div>
            <SimpleMedTable medications={prn} />
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * Fallback simple table for medications without time-grid scheduling data.
 * Migrated from the original MARView in emr-sim-v2.html.
 */
function SimpleMedTable({ medications }: { medications: Medication[] }) {
  if (medications.length === 0) {
    return (
      <div className="text-muted" style={{ padding: 10, textAlign: 'center' }}>
        No medications in this category
      </div>
    );
  }

  return (
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
        {medications.map((med, idx) => (
          <tr key={idx}>
            <td style={{ fontWeight: 600 }}>{med.name}</td>
            <td>{med.dose}</td>
            <td>{med.route}</td>
            <td>{med.frequency}</td>
            <td>{med.scheduled ? med.times.join(', ') : 'PRN'}</td>
            <td>{med.lastGiven ?? '—'}</td>
            <td>
              <span className={med.status === 'active' ? 'text-success' : ''}>
                {med.status === 'active' ? '● Active' : med.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
