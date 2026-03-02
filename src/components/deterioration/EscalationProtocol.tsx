import type { ClinicalRisk } from '@/types/vitals'
import { getEscalationText, getRiskColor } from '@/services/qaddsCalculator'

interface EscalationProtocolProps {
  risk: ClinicalRisk
}

interface EscalationTier {
  range: string
  label: string
  risk: ClinicalRisk
  color: string
  textColor: string
}

const ESCALATION_TIERS: EscalationTier[] = [
  {
    range: '0',
    label: 'Routine care',
    risk: 'Routine',
    color: '#ffffff',
    textColor: '#333333',
  },
  {
    range: '1\u20133',
    label: 'Low-level response',
    risk: 'Low',
    color: '#fff3cd',
    textColor: '#856404',
  },
  {
    range: '4\u20135',
    label: 'Moderate',
    risk: 'Moderate',
    color: '#ffd699',
    textColor: '#7a4100',
  },
  {
    range: '6\u20137',
    label: 'High-severity',
    risk: 'High',
    color: '#f8d7da',
    textColor: '#721c24',
  },
  {
    range: '\u22658 or E',
    label: 'Emergency / MET',
    risk: 'Emergency',
    color: '#d5a6e6',
    textColor: '#4a1a6b',
  },
]

export function EscalationProtocol({ risk }: EscalationProtocolProps) {
  const escalationText = getEscalationText(risk)
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
        Escalation Protocol \u2014 {risk}
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

      {/* Q-ADDS Escalation Tiers Reference */}
      <div style={{ padding: '8px 12px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '11px',
            color: 'var(--cerner-dark-blue, #004578)',
            marginBottom: '6px',
          }}
        >
          Q-ADDS Escalation Tiers
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
              <th
                style={{
                  padding: '3px 6px',
                  borderBottom: '1px solid var(--cerner-border, #ccc)',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '10px',
                }}
              >
                Score
              </th>
              <th
                style={{
                  padding: '3px 6px',
                  borderBottom: '1px solid var(--cerner-border, #ccc)',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '10px',
                }}
              >
                Level
              </th>
              <th
                style={{
                  padding: '3px 6px',
                  borderBottom: '1px solid var(--cerner-border, #ccc)',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#555',
                  fontSize: '10px',
                }}
              >
                Response
              </th>
            </tr>
          </thead>
          <tbody>
            {ESCALATION_TIERS.map((tier) => {
              const isActive = tier.risk === risk
              return (
                <tr key={tier.risk}>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      backgroundColor: tier.color,
                      color: tier.textColor,
                      fontWeight: isActive ? 700 : 400,
                      border: isActive ? '2px solid ' + tier.textColor : undefined,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tier.range}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      fontWeight: isActive ? 700 : 400,
                      color: '#333',
                    }}
                  >
                    {tier.label}
                  </td>
                  <td
                    style={{
                      padding: '4px 6px',
                      borderBottom: '1px solid #eee',
                      color: '#555',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {getEscalationText(tier.risk)}
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
