/**
 * @file ResultsView.tsx
 * @description Lab results view migrated from emr-sim-v2.html.
 *
 * Displays laboratory results organised by tabs and categories:
 * - Tabs: Lab - Recent, Lab - Extended, Medical Imaging
 * - Categories: Haematology, Biochemistry, Blood Gas, Coagulation,
 *   Urinalysis, Cardiac (when data is available)
 * - Abnormal values are flagged in red
 */

import { useState } from 'react';
import { usePatientStore } from '../../stores/patientStore';
import type { LabResult, LabResults } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Available result tabs. */
type ResultTab = 'recent' | 'extended' | 'imaging';

/** Lab category configuration for rendering sections. */
interface LabCategory {
  key: keyof LabResults;
  label: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Categories to display on the Recent tab. */
const RECENT_CATEGORIES: LabCategory[] = [
  { key: 'haematology', label: 'Haematology' },
  { key: 'biochemistry', label: 'Biochemistry' },
];

/** Additional categories for the Extended tab. */
const EXTENDED_CATEGORIES: LabCategory[] = [
  { key: 'bloodGas', label: 'Blood Gas' },
  { key: 'coagulation', label: 'Coagulation' },
  { key: 'urinalysis', label: 'Urinalysis' },
  { key: 'cardiac', label: 'Cardiac Markers' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ResultsView displays laboratory and imaging results for the current
 * patient, organised by tabs and clinical discipline categories.
 */
export default function ResultsView() {
  const patient = usePatientStore((s) => s.currentPatient);
  const [activeTab, setActiveTab] = useState<ResultTab>('recent');

  if (!patient) {
    return (
      <div className="text-muted" style={{ padding: 20 }}>
        No patient selected
      </div>
    );
  }

  const results = patient.results;

  /** Determine which categories to display based on the active tab. */
  const getCategories = (): LabCategory[] => {
    switch (activeTab) {
      case 'recent':
        return RECENT_CATEGORIES;
      case 'extended':
        return [...RECENT_CATEGORIES, ...EXTENDED_CATEGORIES];
      case 'imaging':
        return [];
      default:
        return RECENT_CATEGORIES;
    }
  };

  const categories = getCategories();

  return (
    <>
      <div className="content-header">Results</div>
      <div className="content-tabs">
        <div
          className={`content-tab${activeTab === 'recent' ? ' active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Lab - Recent
        </div>
        <div
          className={`content-tab${activeTab === 'extended' ? ' active' : ''}`}
          onClick={() => setActiveTab('extended')}
        >
          Lab - Extended
        </div>
        <div
          className={`content-tab${activeTab === 'imaging' ? ' active' : ''}`}
          onClick={() => setActiveTab('imaging')}
        >
          Medical Imaging
        </div>
      </div>
      <div className="content-body">
        {activeTab === 'imaging' ? (
          <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
            No medical imaging results available
          </div>
        ) : (
          categories.map((cat) => {
            const data = results[cat.key];
            if (!data || data.length === 0) return null;
            return (
              <LabResultSection
                key={cat.key}
                label={cat.label}
                results={data}
              />
            );
          })
        )}

        {/* Show message if no categories have data */}
        {activeTab !== 'imaging' &&
          categories.every((cat) => !results[cat.key]?.length) && (
            <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
              No laboratory results available
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
 * LabResultSection renders a single category of lab results in a table
 * with abnormal value highlighting.
 */
function LabResultSection({
  label,
  results,
}: {
  label: string;
  results: LabResult[];
}) {
  return (
    <div className="vitals-chart mb-10">
      <div className="chart-header">{label}</div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Result</th>
            <th>Unit</th>
            <th>Reference Range</th>
            <th>Flag</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, idx) => {
            const isAbnormal = result.flag && result.flag !== 'normal';
            return (
              <tr key={idx}>
                <td>{result.test}</td>
                <td className={isAbnormal ? 'text-danger' : ''}>
                  {result.value}
                </td>
                <td>{result.unit}</td>
                <td>{result.range ?? result.normalRange ?? '—'}</td>
                <td className={isAbnormal ? 'text-danger' : ''}>
                  {result.flag || ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
