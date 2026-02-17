/**
 * @file StatusBar.tsx
 * @description Footer status bar showing simulation info and training mode indicator.
 *
 * Migrated from the StatusBar section of emr-sim-v2.html. Displays the
 * current ward code, simulation date and time from the clock store,
 * and a "Training Mode" badge on the right.
 */

import { useClockStore } from '../../stores/clockStore';
import { usePatientStore } from '../../stores/patientStore';
import '../../styles/components/layout.css';

/**
 * Formats a Date object into a display-friendly date string (DD-MMM-YYYY).
 */
function formatDate(date: Date): string {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats a Date object into a 24-hour time string (HH:MM).
 */
function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * StatusBar renders the footer strip with ward location, current simulation
 * date/time, and the training mode indicator.
 */
export default function StatusBar() {
  const currentTime = useClockStore((s) => s.currentTime);
  const currentPatient = usePatientStore((s) => s.currentPatient);

  /* Extract ward code from the patient location, or show a default. */
  const wardCode = currentPatient?.location?.split(':')[0]?.trim() || 'Ward N/A';

  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        <span className="status-bar-item">
          <span className="status-bar-label">Ward:</span>
          <span>{wardCode}</span>
        </span>
        <span className="status-bar-item">
          <span className="status-bar-label">Date:</span>
          <span>{formatDate(currentTime)}</span>
        </span>
        <span className="status-bar-item">
          <span className="status-bar-label">Time:</span>
          <span>{formatTime(currentTime)}</span>
        </span>
      </div>
      <div className="status-bar-right">
        EMR Simulation - Training Mode
      </div>
    </footer>
  );
}
