import type { ClinicalRisk } from '@/types/vitals'
import { getRiskColor, getEscalationText } from '@/services/qaddsCalculator'

interface ClinicalAlert {
  title: string
  message: string
  risk: ClinicalRisk
  parameters: string[]
}

interface AlertDialogProps {
  alert: ClinicalAlert
  onDismiss: () => void
}

const HEADER_TEXT_COLORS: Record<ClinicalRisk, string> = {
  Routine: '#333333',
  Low: '#856404',
  Moderate: '#7a4100',
  High: '#721c24',
  Emergency: '#4a1a6b',
}

export function AlertDialog({ alert, onDismiss }: AlertDialogProps) {
  const headerBg = getRiskColor(alert.risk)
  const headerTextColor = HEADER_TEXT_COLORS[alert.risk]
  const escalationText = getEscalationText(alert.risk)

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
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: '11px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onDismiss()
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-dialog-title"
    >
      {/* Modal */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          width: '420px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header - colour-coded by risk */}
        <div
          style={{
            backgroundColor: headerBg,
            padding: '10px 16px',
            borderBottom: '1px solid var(--cerner-border, #ccc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            id="alert-dialog-title"
            style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 700,
              color: headerTextColor,
            }}
          >
            {alert.title}
          </h2>
          <span
            style={{
              display: 'inline-block',
              padding: '1px 8px',
              borderRadius: '3px',
              border: '1px solid ' + headerTextColor,
              color: headerTextColor,
              fontWeight: 600,
              fontSize: '10px',
              lineHeight: '16px',
            }}
          >
            {alert.risk}
          </span>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }}>
          {/* Alert Message */}
          <div
            style={{
              marginBottom: '12px',
              color: '#333333',
              lineHeight: '16px',
              fontSize: '11px',
            }}
          >
            {alert.message}
          </div>

          {/* Affected Parameters */}
          {alert.parameters.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '11px',
                  color: 'var(--cerner-dark-blue, #004578)',
                  marginBottom: '4px',
                }}
              >
                Affected Parameters
              </div>
              <ul
                style={{
                  margin: '0',
                  paddingLeft: '18px',
                  color: '#333333',
                  lineHeight: '18px',
                }}
              >
                {alert.parameters.map((param) => (
                  <li key={param} style={{ fontSize: '11px' }}>
                    {param}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Escalation Instructions */}
          <div
            style={{
              padding: '8px 10px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e0e0e0',
              borderRadius: '3px',
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
              Escalation Instructions
            </div>
            <div style={{ color: '#333333', lineHeight: '16px', fontSize: '11px' }}>
              {escalationText}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--cerner-border, #ccc)',
            textAlign: 'right',
            backgroundColor: 'var(--cerner-grid-header, #f5f5f5)',
          }}
        >
          <button
            type="button"
            onClick={onDismiss}
            style={{
              padding: '5px 20px',
              fontSize: '11px',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: 'var(--cerner-blue, #0066b2)',
              border: '1px solid var(--cerner-dark-blue, #004578)',
              borderRadius: '3px',
              cursor: 'pointer',
              lineHeight: '18px',
            }}
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  )
}
