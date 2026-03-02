/**
 * @file METMEOOrderDialog.tsx
 * @description A 4-step form dialog for creating MET-MEO plans.
 *
 * Steps:
 * 1. Criteria Check — auto-populated read-only display of current EWS/E-zone.
 * 2. E-Zone Parameters — select which vital sign is in E-zone, set bounds.
 *    (Only shown when hasEZone is true.)
 * 3. Rationale — required free-text clinical rationale.
 * 4. Duration & Auth — duration slider, clinician role and name.
 *
 * On submit, constructs a {@link METMEOOrder} and passes it to the onSubmit
 * callback. All state is local to the dialog (simulation only).
 */

import { useState, useCallback } from 'react';
import type { METMEOOrder, METMEOTriggerType, AuthorisingRole } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by the METMEOOrderDialog component. */
export interface METMEOOrderDialogProps {
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** Callback to close the dialog. */
  onClose: () => void;
  /** Callback with the completed order on submit. */
  onSubmit: (order: METMEOOrder) => void;
  /** Current aggregate EWS score. */
  ewsScore: number;
  /** Whether any vital sign is in the E-zone. */
  hasEZone: boolean;
  /** Which parameters triggered E-zone. */
  eZoneParameters: string[];
  /** Patient MRN. */
  patientId: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const CARD_STYLE: React.CSSProperties = {
  background: '#fff',
  borderRadius: 6,
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  maxWidth: 600,
  width: '95%',
  maxHeight: '90vh',
  overflow: 'auto',
};

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: '#7b1fa2',
  color: '#fff',
  borderRadius: '6px 6px 0 0',
};

const BODY_STYLE: React.CSSProperties = {
  padding: 16,
};

const FOOTER_STYLE: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  padding: '12px 16px',
  borderTop: '1px solid #e0e0e0',
  background: '#f5f5f5',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontWeight: 600,
  fontSize: 11,
  marginBottom: 4,
  color: '#333',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 11,
  boxSizing: 'border-box',
};

const BTN_PRIMARY: React.CSSProperties = {
  padding: '6px 16px',
  background: '#0066b2',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 11,
};

const BTN_SECONDARY: React.CSSProperties = {
  padding: '6px 16px',
  background: '#e0e0e0',
  color: '#333',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 11,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function deriveTriggerType(ewsScore: number, hasEZone: boolean): METMEOTriggerType {
  if (ewsScore >= 8 && hasEZone) return 'BOTH';
  if (hasEZone) return 'E_ZONE';
  return 'EWS_GTE_8';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function METMEOOrderDialog({
  isOpen,
  onClose,
  onSubmit,
  ewsScore,
  hasEZone,
  eZoneParameters,
  patientId,
}: METMEOOrderDialogProps) {
  // --- Step management ---
  // Steps: 0=Criteria Check, 1=E-Zone Params (conditional), 2=Rationale, 3=Duration & Auth
  const hasEZoneStep = hasEZone;
  const totalSteps = hasEZoneStep ? 4 : 3;

  const [step, setStep] = useState(0);

  // --- Form state ---
  const [selectedEZoneParam, setSelectedEZoneParam] = useState(
    eZoneParameters[0] ?? '',
  );
  const [lowerBound, setLowerBound] = useState('');
  const [upperBound, setUpperBound] = useState('');
  const [rationale, setRationale] = useState('');
  const [durationHours, setDurationHours] = useState(4);
  const [clinicianRole, setClinicianRole] = useState<AuthorisingRole>('REGISTRAR');
  const [clinicianName, setClinicianName] = useState('');

  // Map logical step to display step when E-zone step is absent
  const logicalStep = (() => {
    if (hasEZoneStep) return step;
    // No E-zone step: skip step 1
    if (step === 0) return 0;
    return step + 1;
  })();

  const stepLabels = hasEZoneStep
    ? ['Criteria Check', 'E-Zone Parameters', 'Rationale', 'Duration & Auth']
    : ['Criteria Check', 'Rationale', 'Duration & Auth'];

  // --- Validation ---
  const canProceed = (() => {
    if (logicalStep === 0) return true;
    if (logicalStep === 1) return selectedEZoneParam !== '';
    if (logicalStep === 2) return rationale.trim().length > 0;
    if (logicalStep === 3) return clinicianName.trim().length > 0;
    return false;
  })();

  const isLastStep = step === totalSteps - 1;

  // --- Handlers ---
  const handleNext = useCallback(() => {
    if (isLastStep) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);

      const order: METMEOOrder = {
        orderId: crypto.randomUUID(),
        patientId,
        orderType: 'MET_MEO_PLAN',
        triggerType: deriveTriggerType(ewsScore, hasEZone),
        eZoneVitalSign: hasEZone ? selectedEZoneParam : undefined,
        eZoneLowerBound: hasEZone && lowerBound !== '' ? Number(lowerBound) : undefined,
        eZoneUpperBound: hasEZone && upperBound !== '' ? Number(upperBound) : undefined,
        rationale: rationale.trim(),
        durationHours,
        authorisingClinicianId: clinicianName.trim(),
        authorisingClinicianRole: clinicianRole,
        signedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: 'ACTIVE',
      };

      onSubmit(order);
      // Reset
      setStep(0);
      setRationale('');
      setClinicianName('');
      setDurationHours(4);
    } else {
      setStep((s) => s + 1);
    }
  }, [
    isLastStep, step, durationHours, patientId, ewsScore, hasEZone,
    selectedEZoneParam, lowerBound, upperBound, rationale, clinicianName,
    clinicianRole, onSubmit,
  ]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const handleClose = useCallback(() => {
    setStep(0);
    setRationale('');
    setClinicianName('');
    setDurationHours(4);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  // --- Step content ---
  const renderStepContent = () => {
    switch (logicalStep) {
      // Step 0: Criteria Check (read-only)
      case 0:
        return (
          <div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 12 }}>
              The following MET call criteria have been automatically detected.
            </div>
            <div
              style={{
                background: '#f5f5f5',
                border: '1px solid #e0e0e0',
                borderRadius: 4,
                padding: 12,
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 11 }}>EWS Score: </span>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 13,
                    color: ewsScore >= 8 ? '#7b1fa2' : '#333',
                  }}
                >
                  {ewsScore}
                </span>
                {ewsScore >= 8 && (
                  <span style={{ color: '#7b1fa2', fontSize: 11, marginLeft: 6 }}>
                    (MET criteria: {'\u2265'}8)
                  </span>
                )}
              </div>
              <div>
                <span style={{ fontWeight: 600, fontSize: 11 }}>E-Zone: </span>
                {hasEZone ? (
                  <span style={{ color: '#7b1fa2', fontWeight: 600, fontSize: 11 }}>
                    {eZoneParameters.join(', ')}
                  </span>
                ) : (
                  <span style={{ color: '#999', fontSize: 11 }}>None</span>
                )}
              </div>
            </div>
          </div>
        );

      // Step 1: E-Zone Parameters (only when hasEZone)
      case 1:
        return (
          <div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 12 }}>
              Select the E-zone vital sign and set acceptable bounds for the MET-MEO plan.
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL_STYLE}>E-Zone Vital Sign</label>
              <select
                value={selectedEZoneParam}
                onChange={(e) => setSelectedEZoneParam(e.target.value)}
                style={INPUT_STYLE}
              >
                {eZoneParameters.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>Acceptable Lower Bound</label>
                <input
                  type="number"
                  value={lowerBound}
                  onChange={(e) => setLowerBound(e.target.value)}
                  placeholder="e.g. 90"
                  style={INPUT_STYLE}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LABEL_STYLE}>Acceptable Upper Bound</label>
                <input
                  type="number"
                  value={upperBound}
                  onChange={(e) => setUpperBound(e.target.value)}
                  placeholder="e.g. 180"
                  style={INPUT_STYLE}
                />
              </div>
            </div>
          </div>
        );

      // Step 2: Rationale
      case 2:
        return (
          <div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 12 }}>
              Provide a clinical rationale for the MET-MEO plan. This is a mandatory field.
            </div>
            <label style={LABEL_STYLE}>
              Clinical Rationale <span style={{ color: '#d9534f' }}>*</span>
            </label>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={5}
              placeholder="Enter clinical rationale for modified escalation..."
              style={{
                ...INPUT_STYLE,
                backgroundColor: '#fff9c4',
                resize: 'vertical',
              }}
            />
            {rationale.trim().length === 0 && (
              <div style={{ fontSize: 10, color: '#d9534f', marginTop: 4 }}>
                Rationale is required to proceed.
              </div>
            )}
          </div>
        );

      // Step 3: Duration & Auth
      case 3:
        return (
          <div>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 12 }}>
              Set the order duration and authorising clinician details.
            </div>

            {/* Duration */}
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL_STYLE}>
                Duration: {durationHours} hour{durationHours !== 1 ? 's' : ''}
              </label>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={durationHours}
                onChange={(e) => setDurationHours(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 10,
                  color: '#999',
                }}
              >
                <span>1h</span>
                <span>6h</span>
                <span>12h (max)</span>
              </div>
            </div>

            {/* Authorising Clinician Role */}
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL_STYLE}>Authorising Clinician Role</label>
              <select
                value={clinicianRole}
                onChange={(e) => setClinicianRole(e.target.value as AuthorisingRole)}
                style={INPUT_STYLE}
              >
                <option value="REGISTRAR">Registrar</option>
                <option value="SMO">SMO (Senior Medical Officer)</option>
              </select>
            </div>

            {/* Clinician Name */}
            <div>
              <label style={LABEL_STYLE}>
                Clinician Name <span style={{ color: '#d9534f' }}>*</span>
              </label>
              <input
                type="text"
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                placeholder="Dr. ..."
                style={INPUT_STYLE}
              />
              {clinicianName.trim().length === 0 && (
                <div style={{ fontSize: 10, color: '#d9534f', marginTop: 4 }}>
                  Clinician name is required.
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={OVERLAY_STYLE} onClick={handleClose}>
      <div style={CARD_STYLE} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={HEADER_STYLE}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>
            Create MET-MEO Plan
          </span>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 16,
              cursor: 'pointer',
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Close dialog"
          >
            {'\u2715'}
          </button>
        </div>

        {/* Step indicator */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '10px 16px',
            borderBottom: '1px solid #e0e0e0',
            background: '#fafafa',
          }}
        >
          {stepLabels.map((label, i) => (
            <div
              key={label}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 10,
                fontWeight: i === step ? 700 : 400,
                color: i === step ? '#7b1fa2' : i < step ? '#5cb85c' : '#999',
                borderBottom: i === step ? '2px solid #7b1fa2' : '2px solid transparent',
                paddingBottom: 6,
              }}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={BODY_STYLE}>{renderStepContent()}</div>

        {/* Footer */}
        <div style={FOOTER_STYLE}>
          <div>
            {step > 0 && (
              <button style={BTN_SECONDARY} onClick={handleBack}>
                Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={BTN_SECONDARY} onClick={handleClose}>
              Cancel
            </button>
            <button
              style={{
                ...BTN_PRIMARY,
                opacity: canProceed ? 1 : 0.5,
                cursor: canProceed ? 'pointer' : 'not-allowed',
              }}
              disabled={!canProceed}
              onClick={handleNext}
            >
              {isLastStep ? 'Submit Order' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
