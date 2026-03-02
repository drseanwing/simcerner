import type { ClinicalRisk, PatientStatus } from '@/types/vitals'
import { getEscalationText, getRiskColor } from '@/services/qaddsCalculator'

interface EscalationProtocolProps {
  risk: ClinicalRisk
  status?: PatientStatus
}

interface EscalationRow {
  range: string
  risk: ClinicalRisk
  clinicalStatus: 'Deteriorating' | 'Stable/Improving'
  patientStatusValue: PatientStatus
  frequency: string
  actions: string
  color: string
  textColor: string
}

const ESCALATION_ROWS: EscalationRow[] = [
  {
    range: '0',
    risk: 'Routine',
    clinicalStatus: 'Stable/Improving',
    patientStatusValue: 'stable',
    frequency: '8th hourly (min)',
    actions: 'Nil',
    color: '#ffffff',
    textColor: '#333333',
  },
  {
    range: '1\u20133',
    risk: 'Low',
    clinicalStatus: 'Deteriorating',
    patientStatusValue: 'deteriorating',
    frequency: '1 hourly',
    actions: 'Notify TL; Nurse escort',
    color: '#fff3cd',
    textColor: '#856404',
  },
  {
    range: '1\u20133',
    risk: 'Low',
    clinicalStatus: 'Stable/Improving',
    patientStatusValue: 'stable',
    frequency: '4th hourly (min)',
    actions: 'May be modified by SMO',
    color: '#fff3cd',
    textColor: '#856404',
  },
  {
    range: '4\u20135',
    risk: 'Moderate',
    clinicalStatus: 'Deteriorating',
    patientStatusValue: 'deteriorating',
    frequency: '1 hourly',
    actions:
      'Notify TL; RMO review within 30 min; Nurse escort; If no review \u2192 call Registrar',
    color: '#ffd699',
    textColor: '#7a4100',
  },
  {
    range: '4\u20135',
    risk: 'Moderate',
    clinicalStatus: 'Stable/Improving',
    patientStatusValue: 'stable',
    frequency: '2nd hourly (min)',
    actions: 'May be modified by SMO',
    color: '#ffd699',
    textColor: '#7a4100',
  },
  {
    range: '6\u20137',
    risk: 'High',
    clinicalStatus: 'Deteriorating',
    patientStatusValue: 'deteriorating',
    frequency: '\u00BD hourly',
    actions:
      'Notify TL; Registrar review within 30 min; Nurse escort; If no review \u2192 call MET/SMO',
    color: '#f8d7da',
    textColor: '#721c24',
  },
  {
    range: '6\u20137',
    risk: 'High',
    clinicalStatus: 'Stable/Improving',
    patientStatusValue: 'stable',
    frequency: '1 hourly (min)',
    actions: 'May be modified by SMO',
    color: '#f8d7da',
    textColor: '#721c24',
  },
  {
    range: '\u22658 or E',
    risk: 'Emergency',
    clinicalStatus: 'Deteriorating',
    patientStatusValue: 'deteriorating',
    frequency: '10 minutely',
    actions:
      'Initiate MET call; Registrar ensure SMO notified; Registrar & Nurse escort',
    color: '#d5a6e6',
    textColor: '#4a1a6b',
  },
]

export function EscalationProtocol({ risk, status }: EscalationProtocolProps) {
  const effectiveStatus: PatientStatus = status ?? 'stable'
  const escalationText = getEscalationText(risk, effectiveStatus)
  const headerBg = getRiskColor(risk)

  const headerTextColor =
    risk === 'Routine'
      ? '#333333'
      : risk === 'Low'
        ? '#856404'
        : risk === 'Moderate'
          ? '#7a4100'
          : risk === 'High'
            ? '#721c24'
            : '#4a1a6b'

  const thStyle: React.CSSProperties = {
    padding: '3px 6px',
    borderBottom: '1px solid var(--cerner-border, #ccc)',
    textAlign: 'left',
    fontWeight: 600,
    color: '#555',
    fontSize: '10px',
  }

  return (
    <div
      style={{
        border: '1px solid var(--cerner-border, #ccc)',
        borderRadius: '3px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: '11px',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Colour-coded header bar */}
      <div
        style={{
          backgroundColor: headerBg,
          borderBottom: '1px solid var(--cerner-border, #ccc)',
          padding: '8px 10px',
          fontWeight: 700,
          fontSize: '12px',
          color: headerTextColor,
        }}
      >
        Escalation Protocol &mdash; {risk}
      </div>

      {/* Current escalation instructions */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--cerner-border, #ccc)',
          backgroundColor: '#fafafa',
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: '11px',
            color: 'var(--cerner-dark-blue, #004578)',
            marginBottom: '4px',
          }}
        >
          Recommended Response
        </div>
        <div style={{ color: '#333333', lineHeight: '16px' }}>{escalationText}</div>
      </div>

      {/* Q-ADDS Graded Response Reference Table */}
      <div style={{ padding: '8px 12px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '11px',
            color: 'var(--cerner-dark-blue, #004578)',
            marginBottom: '6px',
          }}
        >
          Q-ADDS Graded Response
        </div>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '11px',
          }}
        >
          <thead>
            <tr>
              <th style={thStyle}>Score Range</th>
              <th style={thStyle}>Clinical Status</th>
              <th style={thStyle}>Observation Frequency</th>
              <th style={thStyle}>Notification &amp; Actions</th>
            </tr>
          </thead>
          <tbody>
            {ESCALATION_ROWS.map((row, idx) => {
              const isActive =
                row.risk === risk && row.patientStatusValue === effectiveStatus
              return (
                <tr key={idx}>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      borderLeft: isActive
                        ? '4px solid ' + row.textColor
                        : '4px solid transparent',
                      backgroundColor: isActive ? row.color : undefined,
                      color: row.textColor,
                      fontWeight: isActive ? 700 : 400,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.range}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      fontWeight: isActive ? 700 : 400,
                      color: '#333',
                      backgroundColor: isActive ? row.color : undefined,
                    }}
                  >
                    {row.clinicalStatus}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      fontWeight: isActive ? 700 : 400,
                      color: '#333',
                      backgroundColor: isActive ? row.color : undefined,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.frequency}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      color: '#555',
                      fontWeight: isActive ? 600 : 400,
                      backgroundColor: isActive ? row.color : undefined,
                    }}
                  >
                    {row.actions}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
