/**
 * MEO Plan Dialog — modal overlay for the MEO (Modified Escalation and
 * Observation) Plan.
 *
 * Accessed from the Managing Deterioration page via the MeoPlanSection link.
 * Contains:
 *   - Medical Officer Order Section (order buttons for MET-MEO Plan and
 *     Modified Observation Frequency, plus cancel actions)
 *   - Nursing Section with reference tables for EWS-based and E-zone-based
 *     deterioration criteria, plus observation comments and patient status
 *
 * Matches the official Cerner ieMR dialog layout used in Queensland Health.
 */

import { useState } from 'react'

interface MeoPlanDialogProps {
  onClose: () => void
  onOpenMetMeoForm: () => void
  onOpenMofForm: () => void
  onCancelMetMeo: () => void
  onCancelMof: () => void
  hasActiveMetMeo: boolean
  hasActiveMof: boolean
}

const FONT_FAMILY = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

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
  verticalAlign: 'top',
  fontSize: '11px',
  fontFamily: FONT_FAMILY,
  color: '#333333',
  lineHeight: '16px',
}

const deterioratingBgStyle: React.CSSProperties = {
  ...tdStyle,
  backgroundColor: '#f8d7da',
}

export function MeoPlanDialog({
  onClose,
  onOpenMetMeoForm,
  onOpenMofForm,
  onCancelMetMeo,
  onCancelMof,
  hasActiveMetMeo,
  hasActiveMof,
}: MeoPlanDialogProps) {
  const [moAction, setMoAction] = useState<
    'orderMof' | 'cancelMof' | 'orderMetMeo' | 'cancelMetMeo' | null
  >(null)
  const [observationComments, setObservationComments] = useState('')
  const [patientStatus, setPatientStatus] = useState<'STABLE' | 'DETERIORATING' | null>(null)

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  function handleMoActionConfirm() {
    if (moAction === 'orderMof') {
      onOpenMofForm()
    } else if (moAction === 'cancelMof') {
      onCancelMof()
    } else if (moAction === 'orderMetMeo') {
      onOpenMetMeoForm()
    } else if (moAction === 'cancelMetMeo') {
      onCancelMetMeo()
    }
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
      aria-labelledby="meo-plan-dialog-title"
      onClick={handleOverlayClick}
    >
      {/* Modal container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          width: '720px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--cerner-border, #ccc)',
            textAlign: 'center',
          }}
        >
          <h2
            id="meo-plan-dialog-title"
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--cerner-dark-blue, #004578)',
              fontFamily: FONT_FAMILY,
            }}
          >
            MEO (Modified Escalation and Observation) Plan
          </h2>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* ── Medical Officer Order Section ── */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '12px',
                color: '#333333',
                marginBottom: '2px',
              }}
            >
              Medical Officer Order Section
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#666666',
                fontStyle: 'italic',
                marginBottom: '12px',
              }}
            >
              (Medical Officer Only)
            </div>

            {/* Order rows in a grid layout */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                rowGap: '8px',
                columnGap: '16px',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              {/* Row 1: Modified Observation Frequency */}
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="mo-action"
                  value="orderMof"
                  checked={moAction === 'orderMof'}
                  onChange={() => setMoAction('orderMof')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setMoAction('orderMof')
                    onOpenMofForm()
                  }}
                  style={{
                    backgroundColor: 'var(--cerner-dark-blue, #004578)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '11px',
                    fontFamily: FONT_FAMILY,
                    fontWeight: 600,
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  Order Modified Observation Frequency
                </button>
              </label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: hasActiveMof ? 'pointer' : 'not-allowed',
                  opacity: hasActiveMof ? 1 : 0.5,
                }}
              >
                <input
                  type="radio"
                  name="mo-action"
                  value="cancelMof"
                  checked={moAction === 'cancelMof'}
                  onChange={() => setMoAction('cancelMof')}
                  disabled={!hasActiveMof}
                />
                <span style={{ fontSize: '11px', color: hasActiveMof ? '#333333' : '#999999' }}>
                  Cancel
                </span>
              </label>

              {/* Row 2: MET-MEO Plan */}
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="mo-action"
                  value="orderMetMeo"
                  checked={moAction === 'orderMetMeo'}
                  onChange={() => setMoAction('orderMetMeo')}
                />
                <button
                  type="button"
                  onClick={() => {
                    setMoAction('orderMetMeo')
                    onOpenMetMeoForm()
                  }}
                  style={{
                    backgroundColor: 'var(--cerner-dark-blue, #004578)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    fontSize: '11px',
                    fontFamily: FONT_FAMILY,
                    fontWeight: 600,
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  Order MET-MEO Plan
                </button>
              </label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: hasActiveMetMeo ? 'pointer' : 'not-allowed',
                  opacity: hasActiveMetMeo ? 1 : 0.5,
                }}
              >
                <input
                  type="radio"
                  name="mo-action"
                  value="cancelMetMeo"
                  checked={moAction === 'cancelMetMeo'}
                  onChange={() => setMoAction('cancelMetMeo')}
                  disabled={!hasActiveMetMeo}
                />
                <span style={{ fontSize: '11px', color: hasActiveMetMeo ? '#333333' : '#999999' }}>
                  Cancel
                </span>
              </label>
            </div>

            {/* Confirm MO action button (only for cancel actions) */}
            {(moAction === 'cancelMof' || moAction === 'cancelMetMeo') && (
              <div style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleMoActionConfirm}
                  style={{
                    backgroundColor: '#dc3545',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '11px',
                    fontFamily: FONT_FAMILY,
                    fontWeight: 600,
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  Confirm Cancellation
                </button>
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <hr
            style={{
              border: 'none',
              borderTop: '2px solid var(--cerner-border, #ccc)',
              margin: '16px 0',
            }}
          />

          {/* ── Nursing Section ── */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '12px',
                color: '#333333',
                marginBottom: '4px',
              }}
            >
              Nursing Section
            </div>
            <div
              style={{
                fontWeight: 600,
                fontSize: '11px',
                color: '#333333',
                marginBottom: '2px',
              }}
            >
              Nursing MET-MEO instructions:
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#333333',
                marginBottom: '14px',
                lineHeight: '16px',
              }}
            >
              Check MET-MEO expiry, if not expired, follow below:
            </div>

            {/* ── Table 1: Total EW Score in MET range ── */}
            <div
              style={{
                fontWeight: 700,
                fontSize: '11px',
                color: '#333333',
                textDecoration: 'underline',
                marginBottom: '8px',
              }}
            >
              Total EW Score is in the MET range ({'\u2265'}8)
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '16px',
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '20%' }}>Q-ADDS score</th>
                  <th style={{ ...thStyle, width: '35%' }}>Clinical status</th>
                  <th style={{ ...thStyle, width: '45%' }}>Required actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Deteriorating row */}
                <tr>
                  <td
                    style={{
                      ...deterioratingBgStyle,
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                    rowSpan={2}
                  >
                    {'\u2265'}8
                  </td>
                  <td style={deterioratingBgStyle}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Deteriorating</div>
                    <div style={{ marginBottom: '2px', fontSize: '10px' }}>
                      Any of the following:
                    </div>
                    <ol
                      style={{
                        margin: '0 0 0 0',
                        paddingLeft: '16px',
                        lineHeight: '16px',
                        fontSize: '10px',
                      }}
                    >
                      <li style={{ marginBottom: '2px' }}>
                        Clinical concern/patient worsening
                      </li>
                      <li style={{ marginBottom: '2px' }}>
                        NEW contributing vital sign(s)
                      </li>
                      <li style={{ marginBottom: '2px' }}>
                        Score higher than last score
                      </li>
                    </ol>
                  </td>
                  <td style={deterioratingBgStyle}>
                    <ol
                      style={{
                        margin: 0,
                        paddingLeft: '16px',
                        lineHeight: '16px',
                        fontSize: '10px',
                      }}
                    >
                      <li style={{ marginBottom: '2px' }}>Initiate MET Call</li>
                      <li style={{ marginBottom: '2px' }}>
                        10 minutely observations until MET arrives
                      </li>
                      <li style={{ marginBottom: '2px' }}>
                        Follow MET team instructions
                      </li>
                    </ol>
                  </td>
                </tr>
                {/* Stable row */}
                <tr>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Stable</div>
                    <div style={{ fontStyle: 'italic', color: '#555555', fontSize: '10px' }}>
                      None of the 3 deteriorating factors above
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '10px', lineHeight: '16px' }}>
                      {'\u00BD'} hourly observations minimum
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── Table 2: Vital Sign in MET range (purple zone) ── */}
            <div
              style={{
                fontWeight: 700,
                fontSize: '11px',
                color: '#333333',
                textDecoration: 'underline',
                marginBottom: '8px',
              }}
            >
              Vital Sign is in MET range (purple zone)
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginBottom: '16px',
              }}
            >
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '20%' }}>Q-ADDS score</th>
                  <th style={{ ...thStyle, width: '35%' }}>Clinical status</th>
                  <th style={{ ...thStyle, width: '45%' }}>Required actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Deteriorating row */}
                <tr>
                  <td
                    style={{
                      ...deterioratingBgStyle,
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                    rowSpan={2}
                  >
                    E zone
                  </td>
                  <td style={deterioratingBgStyle}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Deteriorating</div>
                    <div style={{ marginBottom: '2px', fontSize: '10px' }}>
                      Any of the following:
                    </div>
                    <ol
                      style={{
                        margin: '0 0 0 0',
                        paddingLeft: '16px',
                        lineHeight: '16px',
                        fontSize: '10px',
                      }}
                    >
                      <li style={{ marginBottom: '2px' }}>
                        Clinical concern/patient worsening
                      </li>
                      <li style={{ marginBottom: '2px' }}>
                        Any vital sign(s) worse
                      </li>
                      <li style={{ marginBottom: '2px' }}>
                        E zone vital sign outside accepted range
                      </li>
                    </ol>
                  </td>
                  <td style={deterioratingBgStyle}>
                    <ol
                      style={{
                        margin: 0,
                        paddingLeft: '16px',
                        lineHeight: '16px',
                        fontSize: '10px',
                      }}
                    >
                      <li style={{ marginBottom: '2px' }}>Initiate MET Call</li>
                      <li style={{ marginBottom: '2px' }}>
                        10 minutely observations until MET arrives
                      </li>
                      <li style={{ marginBottom: '2px' }}>
                        Follow MET team instructions
                      </li>
                    </ol>
                  </td>
                </tr>
                {/* Stable row */}
                <tr>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>Stable</div>
                    <div style={{ fontStyle: 'italic', color: '#555555', fontSize: '10px' }}>
                      None of the 3 deteriorating factors above
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontSize: '10px', lineHeight: '16px' }}>
                      {'\u00BD'} hourly observations minimum
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── Observation Comments ── */}
            <div style={{ marginBottom: '12px' }}>
              <label
                htmlFor="meo-observation-comments"
                style={{
                  display: 'block',
                  fontWeight: 600,
                  fontSize: '11px',
                  color: '#333333',
                  marginBottom: '4px',
                }}
              >
                Observation Comments:
              </label>
              <textarea
                id="meo-observation-comments"
                value={observationComments}
                onChange={(e) => setObservationComments(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  fontFamily: FONT_FAMILY,
                  fontSize: '11px',
                  padding: '6px 8px',
                  border: '1px solid var(--cerner-border, #ccc)',
                  borderRadius: '3px',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* ── Patient Status ── */}
            <div style={{ marginBottom: '8px' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  color: '#333333',
                  marginRight: '12px',
                }}
              >
                Patient status:
              </span>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  marginRight: '16px',
                }}
              >
                <input
                  type="radio"
                  name="nursing-patient-status"
                  value="STABLE"
                  checked={patientStatus === 'STABLE'}
                  onChange={() => setPatientStatus('STABLE')}
                />
                <span style={{ fontSize: '11px', color: '#333333' }}>Stable</span>
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
                  name="nursing-patient-status"
                  value="DETERIORATING"
                  checked={patientStatus === 'DETERIORATING'}
                  onChange={() => setPatientStatus('DETERIORATING')}
                />
                <span style={{ fontSize: '11px', color: '#333333' }}>Deteriorating</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--cerner-border, #ccc)',
            textAlign: 'right',
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
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
