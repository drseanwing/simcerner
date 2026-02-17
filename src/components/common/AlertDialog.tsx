/**
 * @file AlertDialog.tsx
 * @description Modal alert dialog for deterioration and clinical alerts.
 *
 * Displays a colour-coded dialog box overlaying the application to notify
 * clinicians of important clinical events. Severity levels (info, warning,
 * critical) map to blue, yellow/amber, and red colour schemes respectively.
 */

import { useEffect, useCallback } from 'react';
import '../../styles/components/common.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Alert severity levels determining the visual treatment. */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/** Props accepted by the AlertDialog component. */
export interface AlertDialogProps {
  /** Title text displayed in the colour-coded header. */
  title: string;
  /** Body message providing details about the alert. */
  message: string;
  /** Severity level controlling the header colour scheme. */
  severity: AlertSeverity;
  /** Callback when the clinician acknowledges the alert. */
  onAcknowledge: () => void;
  /** Optional callback when the alert is dismissed without acknowledging. */
  onDismiss?: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AlertDialog renders a modal overlay with a centred dialog box. The header
 * is colour-coded by severity:
 * - **info** → blue
 * - **warning** → amber/yellow
 * - **critical** → red
 *
 * The Escape key triggers dismiss (if provided), otherwise acknowledge.
 */
export default function AlertDialog({
  title,
  message,
  severity,
  onAcknowledge,
  onDismiss,
}: AlertDialogProps) {
  /** Handle Escape key to close the dialog. */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        (onDismiss ?? onAcknowledge)();
      }
    },
    [onAcknowledge, onDismiss],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /** Prevent clicks on the dialog from bubbling to the overlay. */
  const handleDialogClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  /** Severity icon indicator for the header. */
  const severityIcon: Record<AlertSeverity, string> = {
    info: 'ℹ',
    warning: '⚠',
    critical: '🚨',
  };

  return (
    <div
      className="alert-overlay"
      onClick={onDismiss ?? onAcknowledge}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="alert-dialog" onClick={handleDialogClick}>
        {/* Colour-coded header */}
        <div className={`alert-dialog-header alert-dialog-header--${severity}`}>
          <span>{severityIcon[severity]}</span>
          <span>{title}</span>
        </div>

        {/* Message body */}
        <div className="alert-dialog-body">{message}</div>

        {/* Action buttons */}
        <div className="alert-dialog-footer">
          {onDismiss && (
            <button className="btn" onClick={onDismiss} type="button">
              Dismiss
            </button>
          )}
          <button
            className={`btn ${severity === 'critical' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onAcknowledge}
            type="button"
            autoFocus
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
