/**
 * MET-MEO Plan Order Form — 4-step order form for creating a MET-MEO
 * (Modified Escalation and Observation) Plan Order.
 *
 * Matches the official Cerner ieMR MET-MEO Plan Order dialog used in
 * Queensland Health. Steps:
 *
 *   1. Criteria check — at least one MET call criterion must be confirmed
 *   2. E-zone vital sign acceptable range (conditional on Step 1)
 *   3. Rationale for the modified escalation plan
 *   4. Duration and authorising clinician
 *
 * On submission creates a MetMeoOrder object with generated ID and timestamps.
 */

import { useState, useMemo } from 'react'
import type { MetMeoOrder } from '@/types/meo'
import type { ChartVariant } from '@/types/vitals'
import { E_ZONE_VITAL_SIGN_OPTIONS } from '@/types/meo'

interface MetMeoPlanOrderFormProps {
  onClose: () => void
  onSubmit: (order: MetMeoOrder) => void
  chartVariant: ChartVariant
}

const FONT_FAMILY = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

const stepBadgeStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#dc3545',
  color: '#ffffff',
  fontSize: '11px',
  fontWeight: 700,
  fontFamily: FONT_FAMILY,
  borderRadius: '3px',
  padding: '2px 8px',
  marginRight: '8px',
}

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

const thStyle: React.CSSProperties = {
  border: '1px solid #999',
  padding: '6px 8px',
  backgroundColor: '#f0f0f0',
  textAlign: 'left',
  fontWeight: 700,
  fontSize: '11px',
  fontFamily: FONT_FAMILY,
}

const tdStyle: React.CSSProperties = {
  border: '1px solid #999',
  padding: '6px 8px',
  verticalAlign: 'middle',
  fontSize: '11px',
  fontFamily: FONT_FAMILY,
  color: '#333333',
}

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

/** CAVPU levels for the consciousness dropdown in Step 2 */
const CAVPU_OPTIONS = ['Alert', 'Confusion', 'Voice', 'Pain', 'Unresponsive']

export function MetMeoPlanOrderForm({
  onClose,
  onSubmit,
  chartVariant,
}: MetMeoPlanOrderFormProps) {
  // Step 1: criteria
  const [ewsChecked, setEwsChecked] = useState(false)
  const [eZoneChecked, setEZoneChecked] = useState(false)

  // Step 2: E-zone vital sign acceptable range
  const [selectedVitalSign, setSelectedVitalSign] = useState<string | null>(null)
  const [lowerBound, setLowerBound] = useState('')
  const [upperBound, setUpperBound] = useState('')
  const [cavpuLevel, setCavpuLevel] = useState('')

  // Step 3: rationale
  const [rationale, setRationale] = useState('')

  // Step 4: duration and authorisation
  const [durationHours, setDurationHours] = useState('')
  const [clinicianName, setClinicianName] = useState('')
  const [clinicianRole, setClinicianRole] = useState<'REGISTRAR' | 'SMO'>('REGISTRAR')

  const maxDuration = chartVariant === 'standard' ? 12 : 24

  const selectedOption = useMemo(
    () => E_ZONE_VITAL_SIGN_OPTIONS.find((opt) => opt.value === selectedVitalSign) ?? null,
    [selectedVitalSign],
  )

  // Validation
  const step1Valid = ewsChecked || eZoneChecked

  const step2Valid = useMemo(() => {
    if (!eZoneChecked) return true // not required when E-zone not checked
    if (!selectedVitalSign) return false
    if (selectedOption?.inputType === 'dropdown') {
      return cavpuLevel !== ''
    }
    return lowerBound !== '' && upperBound !== ''
  }, [eZoneChecked, selectedVitalSign, selectedOption, lowerBound, upperBound, cavpuLevel])

  const step3Valid = rationale.trim().length > 0

  const step4Valid = useMemo(() => {
    const dur = Number(durationHours)
    if (!Number.isFinite(dur) || dur < 1 || dur > maxDuration) return false
    return clinicianName.trim().length > 0
  }, [durationHours, maxDuration, clinicianName])

  const allValid = step1Valid && step2Valid && step3Valid && step4Valid

  function handleSubmit() {
    if (!allValid) return

    const now = new Date()
    const dur = Number(durationHours)
    const expiresAt = new Date(now.getTime() + dur * 60 * 60 * 1000)

    let triggerType: MetMeoOrder['triggerType'] = 'EWS_GTE_8'
    if (ewsChecked && eZoneChecked) {
      triggerType = 'BOTH'
    } else if (eZoneChecked) {
      triggerType = 'E_ZONE'
    }

    const order: MetMeoOrder = {
      orderId: generateOrderId(),
      orderType: 'MET_MEO_PLAN',
      triggerType,
      eZoneVitalSign: eZoneChecked && selectedVitalSign
        ? (selectedVitalSign as MetMeoOrder['eZoneVitalSign'])
        : null,
      eZoneLowerBound: eZoneChecked && selectedOption?.inputType === 'numeric'
        ? Number(lowerBound)
        : null,
      eZoneUpperBound: eZoneChecked && selectedOption?.inputType === 'numeric'
        ? Number(upperBound)
        : null,
      eZoneCavpuLevel: eZoneChecked && selectedOption?.inputType === 'dropdown'
        ? cavpuLevel
        : null,
      rationale: rationale.trim(),
      durationHours: dur,
      authorisingClinicianName: clinicianName.trim(),
      authorisingClinicianRole: clinicianRole,
      signedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      cancelledAt: null,
      status: 'ACTIVE',
    }

    onSubmit(order)
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
      aria-labelledby="met-meo-order-title"
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          width: '680px',
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
            backgroundColor: 'var(--cerner-dark-blue, #004578)',
            padding: '12px 20px',
          }}
        >
          <h2
            id="met-meo-order-title"
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              fontFamily: FONT_FAMILY,
            }}
          >
            MET-MEO (Modified Escalation and Observation) Plan Order
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
          {/* Warning bullets */}
          <ul
            style={{
              margin: '0 0 16px 0',
              paddingLeft: '18px',
              lineHeight: '16px',
              color: '#333333',
              fontSize: '11px',
            }}
          >
            <li style={{ marginBottom: '6px' }}>
              Altered Calling Criteria/EW score reduction is no longer available in the iEMR
            </li>
            <li style={{ marginBottom: '6px' }}>
              This order will provide a modified response for patients in the MET range where
              appropriate and correctly authorised
            </li>
            <li style={{ marginBottom: '6px' }}>
              Only to be used when there is a treatment plan in place, the treating team is aware,
              and the patient is safe to remain on the ward
            </li>
          </ul>

          {/* ════════════════ STEP 1 ════════════════ */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={stepBadgeStyle}>STEP 1</span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  color: '#333333',
                }}
              >
                Criteria check
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#333333',
                marginBottom: '8px',
                lineHeight: '16px',
              }}
            >
              Complete this order ONLY IF either of the following MET call criteria is reached:
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                marginBottom: '4px',
              }}
            >
              <input
                type="checkbox"
                checked={ewsChecked}
                onChange={(e) => setEwsChecked(e.target.checked)}
              />
              <span style={{ fontSize: '11px', color: '#333333' }}>
                The patient&apos;s EW score is in MET range ({'\u2265'}8)
              </span>
            </label>
            <div
              style={{
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '11px',
                color: '#666666',
                margin: '4px 0',
              }}
            >
              And/Or
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={eZoneChecked}
                onChange={(e) => setEZoneChecked(e.target.checked)}
              />
              <span style={{ fontSize: '11px', color: '#333333' }}>
                The patient has a vital sign(s) in the purple/MET zone
              </span>
            </label>
          </div>

          {/* ════════════════ STEP 2 (conditional) ════════════════ */}
          {eZoneChecked && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={stepBadgeStyle}>STEP 2</span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '11px',
                    color: '#333333',
                  }}
                >
                  Vital sign acceptable range
                </span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#333333',
                  marginBottom: '4px',
                  lineHeight: '16px',
                }}
              >
                ONLY IF the patient has a vital sign(s) in the purple/MET zone:
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#dc3545',
                  fontStyle: 'italic',
                  marginBottom: '10px',
                  lineHeight: '16px',
                }}
              >
                If not, do not complete the below table, leave blank
              </div>

              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '4px',
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: '30px' }}></th>
                    <th style={{ ...thStyle, width: '25%' }}>Vital sign</th>
                    <th style={{ ...thStyle, width: '20%' }}>Lower</th>
                    <th style={{ ...thStyle, width: '20%' }}>Upper</th>
                    <th style={{ ...thStyle, width: '25%' }}>Normal range</th>
                  </tr>
                </thead>
                <tbody>
                  {E_ZONE_VITAL_SIGN_OPTIONS.map((opt) => (
                    <tr key={opt.value}>
                      <td style={tdStyle}>
                        <input
                          type="radio"
                          name="e-zone-vital-sign"
                          value={opt.value}
                          checked={selectedVitalSign === opt.value}
                          onChange={() => {
                            setSelectedVitalSign(opt.value)
                            setLowerBound('')
                            setUpperBound('')
                            setCavpuLevel('')
                          }}
                        />
                      </td>
                      <td style={tdStyle}>
                        {opt.label}
                        {opt.unit && (
                          <span style={{ color: '#666666', marginLeft: '4px' }}>
                            ({opt.unit})
                          </span>
                        )}
                      </td>
                      {opt.inputType === 'numeric' ? (
                        <>
                          <td style={tdStyle}>
                            <input
                              type="number"
                              value={selectedVitalSign === opt.value ? lowerBound : ''}
                              onChange={(e) => setLowerBound(e.target.value)}
                              disabled={selectedVitalSign !== opt.value}
                              style={{
                                ...yellowInputStyle,
                                width: '70px',
                                opacity: selectedVitalSign === opt.value ? 1 : 0.4,
                              }}
                              aria-label={`${opt.label} lower bound`}
                            />
                          </td>
                          <td style={tdStyle}>
                            <input
                              type="number"
                              value={selectedVitalSign === opt.value ? upperBound : ''}
                              onChange={(e) => setUpperBound(e.target.value)}
                              disabled={selectedVitalSign !== opt.value}
                              style={{
                                ...yellowInputStyle,
                                width: '70px',
                                opacity: selectedVitalSign === opt.value ? 1 : 0.4,
                              }}
                              aria-label={`${opt.label} upper bound`}
                            />
                          </td>
                        </>
                      ) : (
                        <td style={tdStyle} colSpan={2}>
                          <select
                            value={selectedVitalSign === opt.value ? cavpuLevel : ''}
                            onChange={(e) => setCavpuLevel(e.target.value)}
                            disabled={selectedVitalSign !== opt.value}
                            style={{
                              ...yellowInputStyle,
                              width: '160px',
                              opacity: selectedVitalSign === opt.value ? 1 : 0.4,
                            }}
                            aria-label="CAVPU acceptable level"
                          >
                            <option value="">-- Select --</option>
                            {CAVPU_OPTIONS.map((level) => (
                              <option key={level} value={level}>
                                {level}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}
                      <td
                        style={{
                          ...tdStyle,
                          color: '#666666',
                          fontStyle: 'italic',
                        }}
                      >
                        {opt.normalRange}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ════════════════ STEP 3 ════════════════ */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={stepBadgeStyle}>STEP 3</span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  color: '#333333',
                }}
              >
                Rationale
              </span>
            </div>
            <textarea
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={4}
              placeholder="Enter rationale for the modified escalation plan (required)"
              style={{
                ...yellowInputStyle,
                width: '100%',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: '16px',
              }}
              aria-label="Rationale for modified escalation plan"
            />
          </div>

          {/* ════════════════ STEP 4 ════════════════ */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={stepBadgeStyle}>STEP 4</span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  color: '#333333',
                }}
              >
                Duration and authorisation
              </span>
            </div>

            {/* Duration */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <label
                htmlFor="met-meo-duration"
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  color: '#333333',
                }}
              >
                Duration:
              </label>
              <input
                id="met-meo-duration"
                type="number"
                min={1}
                max={maxDuration}
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                style={{
                  ...inputStyle,
                  width: '60px',
                }}
              />
              <span style={{ fontSize: '11px', color: '#333333' }}>hours</span>
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#666666',
                marginBottom: '4px',
                lineHeight: '16px',
              }}
            >
              Time will commence upon signing. Maximum {maxDuration} hours.
            </div>

            {/* Authorisation warning */}
            <div
              style={{
                fontWeight: 700,
                fontSize: '11px',
                color: '#dc3545',
                marginBottom: '10px',
                lineHeight: '16px',
              }}
            >
              Must be authorised by an SMO or Registrar
            </div>

            {/* Authorising clinician role */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '11px', color: '#333333' }}>Role:</span>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="clinician-role"
                  value="REGISTRAR"
                  checked={clinicianRole === 'REGISTRAR'}
                  onChange={() => setClinicianRole('REGISTRAR')}
                />
                <span style={{ fontSize: '11px', color: '#333333' }}>Registrar</span>
              </label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="clinician-role"
                  value="SMO"
                  checked={clinicianRole === 'SMO'}
                  onChange={() => setClinicianRole('SMO')}
                />
                <span style={{ fontSize: '11px', color: '#333333' }}>SMO</span>
              </label>
            </div>

            {/* Authorising clinician name */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <label
                htmlFor="met-meo-clinician"
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  color: '#333333',
                  whiteSpace: 'nowrap',
                }}
              >
                Authorising clinician:
              </label>
              <input
                id="met-meo-clinician"
                type="text"
                value={clinicianName}
                onChange={(e) => setClinicianName(e.target.value)}
                placeholder="Search clinician name..."
                style={{
                  ...yellowInputStyle,
                  width: '260px',
                }}
              />
            </div>
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
