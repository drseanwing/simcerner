import { useMemo } from 'react'
import type { VitalSign } from '@/types/patient'
import type { QaddsParameter, QaddsSubScoreValue } from '@/types/vitals'
import {
  calculateQadds,
  getScoreColor,
  getColorHex,
  getRiskColor,
} from '@/services/qaddsCalculator'

interface VitalSignsFlowsheetProps {
  vitals: VitalSign[]
}

/** Row configuration mapping display labels to the Q-ADDS parameter keys. */
interface RowConfig {
  label: string
  unit: string
  parameter: QaddsParameter
  getValue: (v: VitalSign) => string
}

const ROWS: RowConfig[] = [
  {
    label: 'Respiratory Rate',
    unit: '/min',
    parameter: 'rr',
    getValue: (v) => v.rr,
  },
  {
    label: 'SpO\u2082',
    unit: '%',
    parameter: 'spo2',
    getValue: (v) => v.spo2,
  },
  {
    label: 'O\u2082 Flow Rate',
    unit: 'L/min',
    parameter: 'o2FlowRate',
    getValue: (v) => (v.o2FlowRate != null ? String(v.o2FlowRate) : '0'),
  },
  {
    label: 'Systolic BP',
    unit: 'mmHg',
    parameter: 'systolicBP',
    getValue: (v) => v.bp_sys,
  },
  {
    label: 'Heart Rate',
    unit: 'bpm',
    parameter: 'heartRate',
    getValue: (v) => v.hr,
  },
  {
    label: 'Temperature',
    unit: '\u00B0C',
    parameter: 'temperature',
    getValue: (v) => v.temp,
  },
  {
    label: 'Consciousness',
    unit: 'AVPU',
    parameter: 'consciousness',
    getValue: (v) => v.avpu ?? 'Alert',
  },
]

function getCellBackground(score: QaddsSubScoreValue): string {
  return getColorHex(getScoreColor(score))
}

function getTextColor(score: QaddsSubScoreValue): string {
  if (score === 0) return '#333333'
  if (score === 'E') return '#4a1a6b'
  return '#333333'
}

export function VitalSignsFlowsheet({ vitals }: VitalSignsFlowsheetProps) {
  // Most recent first
  const sortedVitals = useMemo(
    () => [...vitals].sort((a, b) => {
      const da = new Date(a.datetime).getTime()
      const db = new Date(b.datetime).getTime()
      return db - da
    }),
    [vitals],
  )

  const scores = useMemo(
    () => sortedVitals.map((v) => calculateQadds(v)),
    [sortedVitals],
  )

  if (vitals.length === 0) {
    return (
      <div
        style={{
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: '11px',
          color: '#888',
          padding: '20px',
          textAlign: 'center',
          border: '1px solid var(--cerner-border, #ccc)',
          borderRadius: '3px',
        }}
      >
        No vital signs recorded
      </div>
    )
  }

  const headerStyle: React.CSSProperties = {
    padding: '4px 6px',
    borderBottom: '1px solid var(--cerner-border, #ccc)',
    borderRight: '1px solid var(--cerner-border, #ccc)',
    backgroundColor: 'var(--cerner-grid-header, #f5f5f5)',
    fontWeight: 600,
    fontSize: '10px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    color: 'var(--cerner-dark-blue, #004578)',
  }

  const labelCellStyle: React.CSSProperties = {
    padding: '3px 8px',
    borderBottom: '1px solid var(--cerner-border, #ccc)',
    borderRight: '1px solid var(--cerner-border, #ccc)',
    backgroundColor: 'var(--cerner-grid-header, #f5f5f5)',
    fontWeight: 600,
    fontSize: '11px',
    whiteSpace: 'nowrap',
    color: '#333333',
    position: 'sticky',
    left: 0,
    zIndex: 1,
  }

  const dataCellBase: React.CSSProperties = {
    padding: '3px 6px',
    borderBottom: '1px solid var(--cerner-border, #ccc)',
    borderRight: '1px solid var(--cerner-border, #ccc)',
    fontSize: '11px',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  }

  return (
    <div
      style={{
        border: '1px solid var(--cerner-border, #ccc)',
        borderRadius: '3px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        overflow: 'hidden',
      }}
    >
      {/* Title */}
      <div
        style={{
          backgroundColor: 'var(--cerner-grid-header, #f5f5f5)',
          borderBottom: '1px solid var(--cerner-border, #ccc)',
          padding: '6px 10px',
          fontWeight: 600,
          fontSize: '12px',
          color: 'var(--cerner-dark-blue, #004578)',
        }}
      >
        Q-ADDS Vital Signs Flowsheet
      </div>

      {/* Table container */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            minWidth: sortedVitals.length * 80 + 160,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  ...headerStyle,
                  textAlign: 'left',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2,
                  minWidth: '140px',
                }}
              >
                Parameter
              </th>
              {sortedVitals.map((v, i) => (
                <th key={i} style={{ ...headerStyle, minWidth: '70px' }}>
                  {v.datetime}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Vital sign parameter rows */}
            {ROWS.map((row) => (
              <tr key={row.parameter}>
                <td style={labelCellStyle}>
                  {row.label}
                  <span style={{ fontWeight: 400, color: '#888', marginLeft: '4px' }}>
                    ({row.unit})
                  </span>
                </td>
                {sortedVitals.map((v, colIdx) => {
                  const subScore = scores[colIdx].subScores[row.parameter]
                  const bg = getCellBackground(subScore.score)
                  const color = getTextColor(subScore.score)
                  return (
                    <td
                      key={colIdx}
                      style={{
                        ...dataCellBase,
                        backgroundColor: bg,
                        color,
                        fontWeight: subScore.score === 'E' ? 700 : 400,
                      }}
                    >
                      {row.getValue(v)}
                      {subScore.score === 'E' && (
                        <span style={{ fontSize: '9px', marginLeft: '2px', fontWeight: 700 }}>
                          E
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* Q-ADDS Total row */}
            <tr>
              <td
                style={{
                  ...labelCellStyle,
                  fontWeight: 700,
                  fontSize: '11px',
                  borderBottom: 'none',
                }}
              >
                Q-ADDS Total
              </td>
              {scores.map((score, colIdx) => {
                const bg = getRiskColor(score.clinicalRisk)
                return (
                  <td
                    key={colIdx}
                    style={{
                      ...dataCellBase,
                      backgroundColor: bg,
                      fontWeight: 700,
                      fontSize: '12px',
                      borderBottom: 'none',
                    }}
                  >
                    {score.totalScore}
                    {score.hasEmergency && (
                      <span
                        style={{
                          fontSize: '9px',
                          marginLeft: '2px',
                          color: '#4a1a6b',
                          fontWeight: 700,
                        }}
                      >
                        E
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
