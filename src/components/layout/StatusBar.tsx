/**
 * @file StatusBar.tsx
 * @description Footer status bar showing simulation clock controls and training mode indicator.
 *
 * Integrates the SimulationClock component for interactive time controls
 * alongside the ward code and training mode badge.
 */

import { usePatientStore } from '../../stores/patientStore';
import SimulationClock from '../common/SimulationClock';
import '../../styles/components/layout.css';

/**
 * StatusBar renders the footer strip with ward location, the simulation
 * clock control panel, and the training mode indicator.
 */
export default function StatusBar() {
  const currentPatient = usePatientStore((s) => s.currentPatient);

  const wardCode = currentPatient?.location?.split(':')[0]?.trim() || 'Ward N/A';

  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        <span className="status-bar-item">
          <span className="status-bar-label">Ward:</span>
          <span>{wardCode}</span>
        </span>
        <SimulationClock />
      </div>
      <div className="status-bar-right">
        EMR Simulation - Training Mode
      </div>
    </footer>
  );
}
