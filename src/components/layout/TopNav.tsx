/**
 * @file TopNav.tsx
 * @description Top navigation bar for the SimCerner EMR application.
 *
 * Migrated from the TopNav section of emr-sim-v2.html. Provides the
 * main menu items (Task, Edit, View, Patient, Chart, etc.) and wires
 * the "Patient" item to clear the current patient selection and return
 * to the patient search screen.
 */

import { usePatientStore } from '../../stores/patientStore';
import { useSessionStore } from '../../stores/sessionStore';
import '../../styles/components/layout.css';

/** Menu item definition for the top navigation bar. */
interface NavItem {
  /** Display label for the menu item. */
  label: string;
  /** Optional click handler — defaults to no-op. */
  onClick?: () => void;
}

/**
 * TopNav renders the Cerner-style blue navigation bar at the top of the
 * application shell. The "Patient" item clears the current patient and
 * navigates back to the search view.
 */
export default function TopNav() {
  const clearCurrentPatient = usePatientStore((s) => s.clearCurrentPatient);
  const setCurrentView = useSessionStore((s) => s.setCurrentView);

  /** Return to patient search by clearing context and switching view. */
  const handlePatientClick = () => {
    clearCurrentPatient();
    setCurrentView('search');
  };

  const navItems: NavItem[] = [
    { label: 'Task' },
    { label: 'Edit' },
    { label: 'View' },
    { label: 'Patient', onClick: handlePatientClick },
    { label: 'Chart' },
    { label: 'Notifications' },
    { label: 'Options' },
    { label: 'Help' },
  ];

  return (
    <nav className="top-nav">
      <span className="top-nav-title">PowerChart</span>
      {navItems.map((item) => (
        <button
          key={item.label}
          className="top-nav-item"
          onClick={item.onClick}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
