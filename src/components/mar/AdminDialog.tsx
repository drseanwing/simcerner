/**
 * @file AdminDialog.tsx
 * @description Medication administration dialog (modal).
 *
 * Presented when a nurse clicks on a MAR cell to record an administration
 * event. Provides:
 * - Medication name, dose, route display
 * - Action buttons: Give, Hold, Refuse, Not Given
 * - Reason selection dropdown (for Hold/Refuse/Not Given)
 * - Nurse name field (auto-filled from session)
 * - Confirm button
 */

import { useState } from 'react';
import type { Medication } from '../../types';
import { MedicationDoseStatus } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by AdminDialog. */
export interface AdminDialogProps {
  /** The medication being administered. */
  medication: Medication;
  /** The scheduled time slot being actioned. */
  scheduledTime: string;
  /** Callback when the dialog is confirmed with an action. */
  onConfirm: (action: MedicationDoseStatus, reason: string, nurse: string) => void;
  /** Callback to close the dialog without acting. */
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Predefined reasons for Hold/Refuse/Not Given actions. */
const HOLD_REASONS = [
  'Clinical decision — withheld per physician order',
  'Patient NPO / fasting',
  'Abnormal vital signs — requires review',
  'Drug interaction — awaiting pharmacy review',
  'Dose adjustment pending',
  'Other (specify in notes)',
];

const REFUSE_REASONS = [
  'Patient declined medication',
  'Patient nauseated / vomiting',
  'Patient sleeping — not disturbed',
  'Other (specify in notes)',
];

const NOT_GIVEN_REASONS = [
  'Medication unavailable',
  'Patient absent from ward',
  'Patient on leave',
  'IV access lost',
  'Other (specify in notes)',
];

/** Action options for the administration dialog. */
type AdminAction =
  | typeof MedicationDoseStatus.GIVEN
  | typeof MedicationDoseStatus.HELD
  | typeof MedicationDoseStatus.REFUSED
  | typeof MedicationDoseStatus.NOT_GIVEN;

const ACTIONS: Array<{ label: string; status: AdminAction; colour: string }> = [
  { label: 'Give', status: MedicationDoseStatus.GIVEN, colour: '#4caf50' },
  { label: 'Hold', status: MedicationDoseStatus.HELD, colour: '#ff9800' },
  { label: 'Refuse', status: MedicationDoseStatus.REFUSED, colour: '#9c27b0' },
  { label: 'Not Given', status: MedicationDoseStatus.NOT_GIVEN, colour: '#757575' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AdminDialog renders a modal for recording a medication administration
 * action (give, hold, refuse, not given) with reason and nurse details.
 */
export default function AdminDialog({
  medication,
  scheduledTime,
  onConfirm,
  onCancel,
}: AdminDialogProps) {
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);
  const [reason, setReason] = useState('');
  const [nurse, setNurse] = useState('RN Simulation User');

  /** Get the relevant reason list for the selected action. */
  const getReasons = (): string[] => {
    switch (selectedAction) {
      case MedicationDoseStatus.HELD:
        return HOLD_REASONS;
      case MedicationDoseStatus.REFUSED:
        return REFUSE_REASONS;
      case MedicationDoseStatus.NOT_GIVEN:
        return NOT_GIVEN_REASONS;
      default:
        return [];
    }
  };

  const needsReason =
    selectedAction != null && selectedAction !== MedicationDoseStatus.GIVEN;

  const canConfirm =
    selectedAction != null &&
    nurse.trim().length > 0 &&
    (!needsReason || reason.trim().length > 0);

  const handleConfirm = () => {
    if (!selectedAction) return;
    onConfirm(selectedAction, reason, nurse);
  };

  return (
    <div className="alert-overlay" onClick={onCancel}>
      <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-dialog__header">
          <span className="admin-dialog__title">Medication Administration</span>
          <button className="admin-dialog__close" onClick={onCancel}>
            ✕
          </button>
        </div>

        {/* Medication info */}
        <div className="admin-dialog__body">
          <div className="admin-dialog__med-info">
            <div className="admin-dialog__med-name">{medication.name}</div>
            <div className="admin-dialog__med-detail">
              {medication.dose} — {medication.route} — {scheduledTime}
            </div>
          </div>

          {/* Action selection */}
          <div className="admin-dialog__actions">
            {ACTIONS.map((action) => (
              <button
                key={action.status}
                className={`btn admin-dialog__action-btn${
                  selectedAction === action.status ? ' admin-dialog__action-btn--selected' : ''
                }`}
                style={
                  selectedAction === action.status
                    ? { backgroundColor: action.colour, color: '#fff', borderColor: action.colour }
                    : undefined
                }
                onClick={() => {
                  setSelectedAction(action.status);
                  setReason('');
                }}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Reason dropdown (for Hold/Refuse/Not Given) */}
          {needsReason && (
            <div className="form-group">
              <label className="form-label">Reason:</label>
              <select
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">— Select reason —</option>
                {getReasons().map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nurse name */}
          <div className="form-group">
            <label className="form-label">Nurse:</label>
            <input
              className="form-control"
              type="text"
              value={nurse}
              onChange={(e) => setNurse(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="admin-dialog__footer">
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
