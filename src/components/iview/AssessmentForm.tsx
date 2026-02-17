/**
 * @file AssessmentForm.tsx
 * @description Modal form for documenting an assessment entry in iView.
 *
 * Opened when a flowsheet cell is clicked. Dynamically renders input
 * controls based on the AssessmentParameter definitions for the
 * selected section. Supports text, number (with unit/range validation),
 * select dropdown, checkbox, and textarea input types.
 *
 * Features:
 * - Pre-fills existing value when editing
 * - Validates required fields and numeric ranges
 * - Displays section name and timestamp in the header
 * - Save/Cancel with keyboard support (Escape to close)
 */

import { useState, useEffect, useCallback } from 'react';
import type { AssessmentParameter, AssessmentEntry } from '../../types/iview';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by the AssessmentForm component. */
export interface AssessmentFormProps {
  /** Section name displayed in the form header. */
  sectionName: string;

  /** Time slot being documented, displayed in the header. */
  timestamp: string;

  /** Parameters for the current section. */
  parameters: AssessmentParameter[];

  /** Existing entries for pre-fill (same section + timestamp). */
  existingEntries: AssessmentEntry[];

  /** Callback fired when the form is saved with new values. */
  onSave: (values: Record<string, string | number | boolean>) => void;

  /** Callback fired when the form is cancelled/closed. */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Validate a numeric value against optional range bounds. */
function validateNumber(
  value: string,
  param: AssessmentParameter,
): string | null {
  if (value === '') return null;
  const num = Number(value);
  if (isNaN(num)) return 'Must be a valid number';
  if (param.normalRange) {
    const { min, max } = param.normalRange;
    if (num < min * 0.3 || num > max * 3) {
      return `Value seems out of plausible range (expected near ${min}–${max})`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AssessmentForm renders a modal dialog for documenting or editing
 * assessment values for a specific section and time slot.
 */
export default function AssessmentForm({
  sectionName,
  timestamp,
  parameters,
  existingEntries,
  onSave,
  onClose,
}: AssessmentFormProps) {
  /** Form values keyed by parameter ID. */
  const [values, setValues] = useState<Record<string, string | number | boolean>>({});

  /** Validation error messages keyed by parameter ID. */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Initialise form values from existing entries. */
  useEffect(() => {
    const initial: Record<string, string | number | boolean> = {};
    for (const param of parameters) {
      const existing = existingEntries.find((e) => e.parameterId === param.id);
      if (existing) {
        initial[param.id] = existing.value;
      } else if (param.type === 'checkbox') {
        initial[param.id] = false;
      } else {
        initial[param.id] = '';
      }
    }
    setValues(initial);
    setErrors({});
  }, [parameters, existingEntries]);

  /** Close on Escape key. */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  /** Update a single field value. */
  function updateValue(paramId: string, value: string | number | boolean) {
    setValues((prev) => ({ ...prev, [paramId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[paramId];
      return next;
    });
  }

  /** Validate all fields and return whether the form is valid. */
  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    for (const param of parameters) {
      const val = values[param.id];
      if (param.type === 'number' && typeof val === 'string') {
        const err = validateNumber(val, param);
        if (err) newErrors[param.id] = err;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  /** Handle form submission. */
  function handleSave() {
    if (!validate()) return;

    const processed: Record<string, string | number | boolean> = {};
    for (const param of parameters) {
      const val = values[param.id];
      if (val === '' || val === undefined) continue;

      if (param.type === 'number' && typeof val === 'string') {
        processed[param.id] = Number(val);
      } else {
        processed[param.id] = val;
      }
    }

    onSave(processed);
  }

  /** Check if any value has been entered. */
  const hasValues = Object.values(values).some(
    (v) => v !== '' && v !== false && v !== undefined,
  );

  return (
    <div
      className="assessment-form-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Document ${sectionName}`}
    >
      <div className="assessment-form">
        {/* Header */}
        <div className="assessment-form__header">
          <div>
            <div className="assessment-form__title">{sectionName}</div>
            <div className="assessment-form__subtitle">{timestamp}</div>
          </div>
          <button
            className="assessment-form__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body — dynamic form fields */}
        <div className="assessment-form__body">
          {parameters.map((param) => (
            <div key={param.id} className="assessment-form__field">
              <label className="assessment-form__label" htmlFor={`af-${param.id}`}>
                {param.label}
                {param.unit && (
                  <span className="assessment-form__unit"> ({param.unit})</span>
                )}
              </label>

              {/* Text input */}
              {param.type === 'text' && (
                <input
                  id={`af-${param.id}`}
                  className="assessment-form__input"
                  type="text"
                  value={String(values[param.id] ?? '')}
                  onChange={(e) => updateValue(param.id, e.target.value)}
                  autoComplete="off"
                />
              )}

              {/* Number input */}
              {param.type === 'number' && (
                <>
                  <input
                    id={`af-${param.id}`}
                    className="assessment-form__input"
                    type="number"
                    step="any"
                    value={String(values[param.id] ?? '')}
                    onChange={(e) => updateValue(param.id, e.target.value)}
                    autoComplete="off"
                  />
                  {param.normalRange && (
                    <div className="assessment-form__range-hint">
                      Normal: {param.normalRange.min}–{param.normalRange.max}
                      {param.unit ? ` ${param.unit}` : ''}
                    </div>
                  )}
                </>
              )}

              {/* Select dropdown */}
              {param.type === 'select' && (
                <select
                  id={`af-${param.id}`}
                  className="assessment-form__select"
                  value={String(values[param.id] ?? '')}
                  onChange={(e) => updateValue(param.id, e.target.value)}
                >
                  <option value="">— Select —</option>
                  {param.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {/* Checkbox */}
              {param.type === 'checkbox' && (
                <div className="assessment-form__checkbox-wrapper">
                  <input
                    id={`af-${param.id}`}
                    type="checkbox"
                    checked={Boolean(values[param.id])}
                    onChange={(e) => updateValue(param.id, e.target.checked)}
                  />
                  <label htmlFor={`af-${param.id}`}>{param.label}</label>
                </div>
              )}

              {/* Textarea */}
              {param.type === 'textarea' && (
                <textarea
                  id={`af-${param.id}`}
                  className="assessment-form__textarea"
                  value={String(values[param.id] ?? '')}
                  onChange={(e) => updateValue(param.id, e.target.value)}
                />
              )}

              {/* Validation error */}
              {errors[param.id] && (
                <div className="assessment-form__error">{errors[param.id]}</div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="assessment-form__footer">
          <button
            className="assessment-form__btn assessment-form__btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="assessment-form__btn assessment-form__btn--save"
            onClick={handleSave}
            disabled={!hasValues}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
