/**
 * @file FluidBalanceView.tsx
 * @description Fluid balance view migrated from emr-sim-v2.html.
 *
 * Displays:
 * - Summary cards: Total Intake (green), Total Output (red), Net Balance
 * - Detailed table with per-entry breakdown
 * - Handles both flat format (intake_oral/intake_iv) and hierarchical
 *   format (intake/output/balance)
 */

import { useMemo } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import type {
  FluidBalanceEntry,
  FluidBalanceEntryFlat,
  FluidBalanceEntryHierarchical,
} from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

/** Type guard: determine if a fluid balance entry uses the flat format. */
function isFlat(entry: FluidBalanceEntry): entry is FluidBalanceEntryFlat {
  return 'intake_oral' in entry;
}

/** Type guard: determine if a fluid balance entry uses the hierarchical format. */
function isHierarchical(
  entry: FluidBalanceEntry,
): entry is FluidBalanceEntryHierarchical {
  return 'intake' in entry && 'output' in entry;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FluidTotals {
  totalIntake: number;
  totalOutput: number;
  balance: number;
}

/** Compute aggregate totals across all entries, handling both formats. */
function calculateTotals(entries: FluidBalanceEntry[]): FluidTotals {
  if (!entries || entries.length === 0) {
    return { totalIntake: 0, totalOutput: 0, balance: 0 };
  }

  let totalIntake = 0;
  let totalOutput = 0;

  for (const entry of entries) {
    if (isFlat(entry)) {
      totalIntake += entry.intake_oral + entry.intake_iv;
      totalOutput += entry.output_urine + entry.output_other;
    } else if (isHierarchical(entry)) {
      totalIntake += entry.intake;
      totalOutput += entry.output;
    }
  }

  return { totalIntake, totalOutput, balance: totalIntake - totalOutput };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * FluidBalanceView displays summary cards and a detailed intake/output table
 * for the current patient's fluid balance data.
 */
export default function FluidBalanceView() {
  const patient = usePatientStore((s) => s.currentPatient);

  const totals = useMemo<FluidTotals>(
    () => calculateTotals(patient?.fluidBalance ?? []),
    [patient?.fluidBalance],
  );

  if (!patient) {
    return (
      <div className="text-muted" style={{ padding: 20 }}>
        No patient selected
      </div>
    );
  }

  const entries = patient.fluidBalance;
  const hasFlat = entries.length > 0 && isFlat(entries[0]);

  return (
    <>
      <div className="content-header">Fluid Balance</div>
      <div className="content-body">
        {/* Summary cards */}
        <div className="fluid-summary">
          <div className="fluid-card positive">
            <div className="fluid-card-label">Total Intake (24h)</div>
            <div className="fluid-card-value">
              {totals.totalIntake}
              <span className="fluid-card-unit"> mL</span>
            </div>
          </div>
          <div className="fluid-card negative">
            <div className="fluid-card-label">Total Output (24h)</div>
            <div className="fluid-card-value">
              {totals.totalOutput}
              <span className="fluid-card-unit"> mL</span>
            </div>
          </div>
          <div
            className={`fluid-card ${
              totals.balance > 0 ? 'positive' : totals.balance < 0 ? 'negative' : 'neutral'
            }`}
          >
            <div className="fluid-card-label">Net Balance (24h)</div>
            <div className="fluid-card-value">
              {totals.balance > 0 ? '+' : ''}
              {totals.balance}
              <span className="fluid-card-unit"> mL</span>
            </div>
          </div>
        </div>

        {/* Detailed table */}
        <div className="vitals-chart">
          <div className="chart-header">Fluid Balance Record</div>
          {entries.length > 0 ? (
            hasFlat ? (
              <FlatTable entries={entries as FluidBalanceEntryFlat[]} />
            ) : (
              <HierarchicalTable
                entries={entries as FluidBalanceEntryHierarchical[]}
              />
            )
          ) : (
            <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
              No fluid balance data recorded
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

/** Table for flat-format fluid balance entries. */
function FlatTable({ entries }: { entries: FluidBalanceEntryFlat[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Date/Time</th>
          <th>Oral Intake (mL)</th>
          <th>IV Intake (mL)</th>
          <th>Total Intake (mL)</th>
          <th>Urine Output (mL)</th>
          <th>Other Output (mL)</th>
          <th>Total Output (mL)</th>
          <th>Balance (mL)</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, idx) => {
          const intake = entry.intake_oral + entry.intake_iv;
          const output = entry.output_urine + entry.output_other;
          const balance = intake - output;
          return (
            <tr key={idx}>
              <td>{entry.datetime}</td>
              <td>{entry.intake_oral}</td>
              <td>{entry.intake_iv}</td>
              <td style={{ fontWeight: 600 }}>{intake}</td>
              <td>{entry.output_urine}</td>
              <td>{entry.output_other}</td>
              <td style={{ fontWeight: 600 }}>{output}</td>
              <td
                className={
                  balance > 0 ? 'text-success' : balance < 0 ? 'text-danger' : ''
                }
              >
                {balance > 0 ? '+' : ''}
                {balance}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Table for hierarchical-format fluid balance entries. */
function HierarchicalTable({
  entries,
}: {
  entries: FluidBalanceEntryHierarchical[];
}) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Date/Time</th>
          <th>Intake (mL)</th>
          <th>Output (mL)</th>
          <th>Balance (mL)</th>
          <th>IV Fluid Type</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry, idx) => (
          <tr key={idx}>
            <td>{entry.datetime}</td>
            <td style={{ fontWeight: 600 }}>{entry.intake}</td>
            <td style={{ fontWeight: 600 }}>{entry.output}</td>
            <td
              className={
                entry.balance > 0
                  ? 'text-success'
                  : entry.balance < 0
                    ? 'text-danger'
                    : ''
              }
            >
              {entry.balance > 0 ? '+' : ''}
              {entry.balance}
            </td>
            <td>{entry.ivFluidType ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
