/**
 * @file App.tsx
 * @description Root application component for the SimCerner EMR.
 *
 * Manages the top-level layout and view routing. On mount it loads
 * patient data via the patientLoader service and populates the patient
 * store. When no patient is selected the PatientSearch view is displayed;
 * when a patient is selected the full EMR layout is shown (TopNav,
 * PatientBanner, Sidebar + content area, StatusBar).
 *
 * View routing uses conditional rendering driven by sessionStore.currentView
 * to match the original emr-sim-v2.html approach.
 */

import { useEffect } from 'react';
import { usePatientStore } from './stores/patientStore';
import { useSessionStore } from './stores/sessionStore';
import { loadPatients } from './services/patientLoader';
import { TopNav, PatientBanner, Sidebar, StatusBar } from './components/layout';
import PatientSearch from './components/search/PatientSearch';
import DoctorView from './components/doctor-view/DoctorView';
import DeteriorationView from './components/deterioration/DeteriorationView';
import VitalsGraphView from './components/vitals-graph/VitalsGraphView';
import FluidBalanceView from './components/fluid-balance/FluidBalanceView';
import MARView from './components/mar/MARView';
import OrdersView from './components/orders/OrdersView';
import ResultsView from './components/results/ResultsView';
import DocumentationView from './components/documentation/DocumentationView';
import './styles/components/layout.css';

// ---------------------------------------------------------------------------
// Placeholder view components
// ---------------------------------------------------------------------------

/**
 * Placeholder component rendered for views that have not yet been implemented.
 * Will be replaced with real view components as they are built.
 */
function PlaceholderView({ name }: { name: string }) {
  return (
    <div className="content-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--cerner-dark-blue)', marginBottom: '8px' }}>{name}</h2>
        <p>This view is under construction.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View registry
// ---------------------------------------------------------------------------

/**
 * Maps sessionStore.currentView identifiers to their display names.
 * View components will be swapped in as they are implemented; until
 * then, a PlaceholderView is rendered with the display name.
 */
const VIEW_LABELS: Record<string, string> = {
  'doctor-view': 'Doctor View',
  'vitals': 'Managing Deterioration',
  'vitals-graph': 'Vitals Graph',
  'fluid-balance': 'Fluid Balance',
  'orders': 'Orders',
  'results': 'Results',
  'documentation': 'Documentation',
  'mar': 'MAR',
  'iview': 'Interactive View',
  'deterioration': 'Deterioration Dashboard',
};

/**
 * Resolves the current view identifier to a rendered component.
 * Returns a PlaceholderView for views that are not yet implemented.
 */
function renderCurrentView(currentView: string): React.ReactNode {
  switch (currentView) {
    case 'doctor-view':
      return <DoctorView />;
    case 'vitals':
    case 'deterioration':
      return <DeteriorationView />;
    case 'vitals-graph':
      return <VitalsGraphView />;
    case 'fluid-balance':
      return <FluidBalanceView />;
    case 'mar':
      return <MARView />;
    case 'orders':
      return <OrdersView />;
    case 'results':
      return <ResultsView />;
    case 'documentation':
      return <DocumentationView />;
    default:
      const label = VIEW_LABELS[currentView] ?? currentView;
      return <PlaceholderView name={label} />;
  }
}

// ---------------------------------------------------------------------------
// App Component
// ---------------------------------------------------------------------------

/**
 * App is the root component that orchestrates the entire SimCerner EMR.
 *
 * Lifecycle:
 * 1. On mount, loads patients from the external manifest (or falls back
 *    to defaults) and populates the patient store.
 * 2. If no patient is selected (currentPatient is null), renders the
 *    PatientSearch screen.
 * 3. Once a patient is selected, renders the full EMR chrome: TopNav,
 *    PatientBanner, Sidebar + content area, and StatusBar.
 */
export default function App() {
  const currentPatient = usePatientStore((s) => s.currentPatient);
  const setPatients = usePatientStore((s) => s.setPatients);
  const setLoading = usePatientStore((s) => s.setLoading);
  const setError = usePatientStore((s) => s.setError);
  const loading = usePatientStore((s) => s.loading);
  const error = usePatientStore((s) => s.error);
  const currentView = useSessionStore((s) => s.currentView);

  /* Load patients on mount. */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const patients = await loadPatients();
        if (!cancelled) {
          setPatients(patients);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load patients');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [setPatients, setLoading, setError]);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="loading-spinner loading-spinner--lg" />
        <span>Loading patient data…</span>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="error-message">
        <div className="error-message__title">Error Loading Data</div>
        <div className="error-message__detail">{error}</div>
      </div>
    );
  }

  /* ---- No patient selected → show search ---- */
  if (!currentPatient) {
    return <PatientSearch />;
  }

  /* ---- Full EMR layout with selected patient ---- */
  return (
    <>
      <TopNav />
      <PatientBanner patient={currentPatient} />
      <div className="main-container">
        <Sidebar />
        <main className="content-area">
          {renderCurrentView(currentView)}
        </main>
      </div>
      <StatusBar />
    </>
  );
}
