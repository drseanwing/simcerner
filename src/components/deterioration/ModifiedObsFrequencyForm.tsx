/**
 * Modified Observation Frequency Order Form — allows an SMO to order a
 * reduced observation frequency for patients meeting specific criteria.
 *
 * Matches the official Cerner ieMR Modified Observation Frequency dialog
 * used in Queensland Health. Features:
 *
 *   - Radio selection from 4 pre-defined options with inline frequency input
 *   - Warning text about reduced monitoring
 *   - SMO-only authorisation requirement
 *   - Free text "Other" option
 *
 * On submission creates a ModifiedObsFrequencyOrder with generated ID.
 */

import { useState, useMemo } from 'react'
import type { ModifiedObsFrequencyOrder } from '@/types/meo'
import { MOF_OPTION_LABELS } from '@/types/meo'

interface ModifiedObsFrequencyFormProps {
  onClose: () => void
  onSubmit: (order: ModifiedObsFrequencyOrder) => void
}

const FONT_FAMILY = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

const inputStyle: React.CSSProperties = {
  fontFamily: FONT_FAMILY,
  fontSize: '11px',
  padding: '4px 6px',
  border: '1px solid var(--cerner-border, #ccc)',
  borderRadius: '3px',
  boxSizing: 'border-box' as const,
}

const yellowInputStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: '#fffde7',
}

type MofOptionKey = ModifiedObsFrequencyOrder['optionSelected']

interface MofOptionConfig {
  key: MofOptionKey
  labelTemplate: string
}

const MOF_OPTIONS: MofOptionConfig[] = [
  { key: 'LONG_STAY_RESPITE', labelTemplate: MOF_OPTION_LABELS.LONG_STAY_RESPITE },
  { key: 'STABLE_EXPECTED', labelTemplate: MOF_OPTION_LABELS.STABLE_EXPECTED },
  { key: 'REDUCE_DISTRESS_ARP', labelTemplate: MOF_OPTION_LABELS.REDUCE_DISTRESS_ARP },
  { key: 'OTHER', labelTemplate: MOF_OPTION_LABELS.OTHER },
]

/** Generate a pseudo-UUID for order IDs in the simulation */
function generateOrderId(): string {
  const segments = [8, 4, 4, 4, 12]
  return segments
    .map((len) => {
      let s = ''
      for (let i = 0; i < len; i++) {
        s += Math.floor(Math.random() * 16).toString(16)
      }
      return s
    })
    .join('-')
}

export function ModifiedObsFrequencyForm({
  onClose,
  onSubmit,
}: ModifiedObsFrequencyFormProps) {
  const [selectedOption, setSelectedOption] = useState<MofOptionKey | null>(null)
  const [frequencyHours, setFrequencyHours] = useState('')
  const [otherFreeText, setOtherFreeText] = useState('')
  const [smoName, setSmoName] = useState('')

  const allValid = useMemo(() => {
    if (!selectedOption) return false
    const freq = Number(frequencyHours)
    if (!Number.isFinite(freq) || freq < 1) return false
    if (selectedOption === 'OTHER' && otherFreeText.trim().length === 0) return false
    if (smoName.trim().length === 0) return false
    return true
  }, [selectedOption, frequencyHours, otherFreeText, smoName])

  function handleSubmit() {
    if (!allValid || !selectedOption) return

    const order: ModifiedObsFrequencyOrder = {
      orderId: generateOrderId(),
      orderType: 'MODIFIED_OBS_FREQUENCY',
      optionSelected: selectedOption,
      frequencyHours: Number(frequencyHours),
      otherFreeText: selectedOption === 'OTHER' ? otherFreeText.trim() : null,
      authorisingSmoName: smoName.trim(),
      signedAt: new Date().toISOString(),
      cancelledAt: null,
      status: 'ACTIVE',
    }

    onSubmit(order)
  }

  /**
   * Render the label text for an option, inserting an inline frequency
   * input where the {hours} placeholder appears.
   */
  function renderOptionLabel(option: MofOptionConfig) {
    const isSelected = selectedOption === option.key
    const parts = option.labelTemplate.split('{hours}')

    if (parts.length === 1) {
      // "Other" option — just the label text
      return (
        <span style={{ fontSize: '11px', color: '#333333' }}>{option.labelTemplate}</span>
      )
    }

    return (
      <span style={{ fontSize: '11px', color: '#333333', lineHeight: '20px' }}>
        {parts[0]}
        <input
          type="number"
          min={1}
          value={isSelected ? frequencyHours : ''}
          onChange={(e) => setFrequencyHours(e.target.value)}
          disabled={!isSelected}
          style={{
            ...inputStyle,
            width: '40px',
            margin: '0 2px',
            textAlign: 'center',
            opacity: isSelected ? 1 : 0.4,
          }}
          aria-label={`Frequency in hours for ${option.key}`}
        />
        {parts[1]}
      </span>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mof-order-title"
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          width: '600px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--cerner-border, #ccc)',
          }}
        >
          <h2
            id="mof-order-title"
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--cerner-dark-blue, #004578)',
              fontFamily: FONT_FAMILY,
            }}
          >
            Modified observation frequency order
          </h2>
        </div>

        {/* ── Scrollable body ── */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Reduce observation frequency label */}
          <div
            style={{
              fontWeight: 600,
              fontSize: '11px',
              color: '#333333',
              marginBottom: '8px',
            }}
          >
            Reduce observation Frequency (SMO authorisation only)
          </div>

          {/* Red warning */}
          <div
            style={{
              fontWeight: 700,
              fontSize: '11px',
              color: '#dc3545',
              marginBottom: '8px',
              lineHeight: '16px',
            }}
          >
            Warning: this order means the patient will be monitored LESS frequently
          </div>

          {/* Examples text */}
          <div
            style={{
              fontSize: '10px',
              color: '#666666',
              fontStyle: 'italic',
              marginBottom: '14px',
              lineHeight: '15px',
            }}
          >
            Select the appropriate clinical scenario below and enter the desired observation
            frequency in hours.
          </div>

          {/* ── Option radios ── */}
          <div style={{ marginBottom: '16px' }}>
            {MOF_OPTIONS.map((option) => {
              const isSelected = selectedOption === option.key
              return (
                <div key={option.key} style={{ marginBottom: '10px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="mof-option"
                      value={option.key}
                      checked={isSelected}
                      onChange={() => setSelectedOption(option.key)}
                      style={{ marginTop: '3px', flexShrink: 0 }}
                    />
                    {renderOptionLabel(option)}
                  </label>

                  {/* Free text for "Other" */}
                  {option.key === 'OTHER' && isSelected && (
                    <div style={{ marginLeft: '22px', marginTop: '6px' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '6px',
                        }}
                      >
                        <label
                          htmlFor="mof-frequency"
                          style={{ fontWeight: 600, fontSize: '11px', color: '#333333' }}
                        >
                          Frequency:
                        </label>
                        <input
                          id="mof-frequency"
                          type="number"
                          min={1}
                          value={frequencyHours}
                          onChange={(e) => setFrequencyHours(e.target.value)}
                          style={{
                            ...inputStyle,
                            width: '50px',
                            textAlign: 'center',
                          }}
                        />
                        <span style={{ fontSize: '11px', color: '#333333' }}>hourly</span>
                      </div>
                      <textarea
                        value={otherFreeText}
                        onChange={(e) => setOtherFreeText(e.target.value)}
                        rows={3}
                        placeholder="Enter clinical reason (required)"
                        style={{
                          ...yellowInputStyle,
                          width: '100%',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                          lineHeight: '16px',
                        }}
                        aria-label="Other clinical reason"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Handover warning ── */}
          <div
            style={{
              fontWeight: 700,
              fontSize: '11px',
              color: '#333333',
              textAlign: 'center',
              marginBottom: '16px',
              lineHeight: '16px',
              padding: '8px 0',
              borderTop: '1px solid var(--cerner-border, #ccc)',
              borderBottom: '1px solid var(--cerner-border, #ccc)',
            }}
          >
            This does not replace verbal handover, ENSURE TREATING NURSE INFORMED
          </div>

          {/* ── Authorising SMO ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <label
              htmlFor="mof-smo-name"
              style={{
                fontWeight: 700,
                fontSize: '11px',
                color: '#dc3545',
                whiteSpace: 'nowrap',
              }}
            >
              Authorising SMO:
            </label>
            <input
              id="mof-smo-name"
              type="text"
              value={smoName}
              onChange={(e) => setSmoName(e.target.value)}
              placeholder="Search SMO name..."
              style={{
                ...yellowInputStyle,
                width: '260px',
              }}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--cerner-border, #ccc)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            backgroundColor: '#f5f5f5',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 20px',
              fontSize: '11px',
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
              color: '#333333',
              backgroundColor: '#e0e0e0',
              border: '1px solid var(--cerner-border, #ccc)',
              borderRadius: '3px',
              cursor: 'pointer',
              lineHeight: '18px',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allValid}
            style={{
              padding: '6px 20px',
              fontSize: '11px',
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: allValid ? 'var(--cerner-dark-blue, #004578)' : '#a0b4c8',
              border: allValid ? '1px solid #003460' : '1px solid #8899aa',
              borderRadius: '3px',
              cursor: allValid ? 'pointer' : 'not-allowed',
              lineHeight: '18px',
            }}
          >
            Sign Order
          </button>
        </div>
      </div>
    </div>
  )
}
