/**
 * Discern Alert Dialog.
 *
 * Displays a modal popup matching the official Queensland Health Discern Alert
 * format. The dialog contains:
 *
 *   - Title coloured by risk level
 *   - Bold instruction to navigate to Managing Deterioration graph page
 *   - Two-column table: Clinical status | Required actions
 *     - Deteriorating row with 3 deterioration criteria
 *     - Stable row
 *   - Optional SEPSIS screening prompt in bold red
 *   - Acknowledge button
 */

import type { AlertData } from '@/services/alertEngine'
import { getRiskColor } from '@/services/qaddsCalculator'

interface AlertDialogProps {
  alert: AlertData
  onDismiss: () => void
}

const FONT_FAMILY = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

/** Title text colour per risk level for contrast against the risk background. */
const HEADER_TEXT_COLORS: Record<string, string> = {
  Routine: '#333333',
  Low: '#856404',
  Moderate: '#7a4100',
  High: '#721c24',
  Emergency: '#4a1a6b',
}

export function AlertDialog({ alert, onDismiss }: AlertDialogProps) {
  const headerBg = getRiskColor(alert.risk)
  const headerTextColor = HEADER_TEXT_COLORS[alert.risk] ?? '#333333'

  // Split multi-line messages (e.g. EW Score 4-5 has an additional instruction)
  const messageLines = alert.message.split('\n').filter((line) => line.trim() !== '')

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
      aria-labelledby="alert-dialog-title"
    >
      {/* Modal container */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          width: '500px',
          maxWidth: '90vw',
          maxHeight: '90vh',
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
            borderBottom: '1px solid #ccc',
          }}
        >
          <h2
            id="alert-dialog-title"
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 700,
              color: headerTextColor,
              fontFamily: FONT_FAMILY,
            }}
          >
            {alert.title}
          </h2>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '14px 16px',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Bold instruction line(s) */}
          {messageLines.map((line, i) => (
            <div
              key={i}
              style={{
                fontWeight: 700,
                color: '#333333',
                lineHeight: '16px',
                fontSize: '11px',
                marginBottom: i < messageLines.length - 1 ? '4px' : '14px',
                fontFamily: FONT_FAMILY,
              }}
            >
              {line}
            </div>
          ))}

          {/* E-zone affected parameters */}
          {alert.parameters.length > 0 && (
            <div
              style={{
                marginBottom: '10px',
                fontSize: '11px',
                color: '#333333',
                fontFamily: FONT_FAMILY,
              }}
            >
              <span style={{ fontWeight: 600 }}>Emergency parameter(s): </span>
              {alert.parameters.join(', ')}
            </div>
          )}

          {/* Two-column clinical status / required actions table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              fontFamily: FONT_FAMILY,
              marginBottom: '14px',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: '1px solid #999',
                    padding: '6px 8px',
                    backgroundColor: '#f0f0f0',
                    textAlign: 'left',
                    fontWeight: 700,
                    width: '40%',
                  }}
                >
                  Clinical status
                </th>
                <th
                  style={{
                    border: '1px solid #999',
                    padding: '6px 8px',
                    backgroundColor: '#f0f0f0',
                    textAlign: 'left',
                    fontWeight: 700,
                    width: '60%',
                  }}
                >
                  Required actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Deteriorating row */}
              <tr>
                <td
                  style={{
                    border: '1px solid #999',
                    padding: '6px 8px',
                    verticalAlign: 'top',
                    color: '#333333',
                    lineHeight: '16px',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '6px' }}>
                    Deteriorating
                  </div>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: '16px',
                      lineHeight: '16px',
                    }}
                  >
                    {alert.deterioratingCriteria.map((criterion, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>
                        {criterion}
                      </li>
                    ))}
                  </ol>
                </td>
                <td
                  style={{
                    border: '1px solid #999',
                    padding: '6px 8px',
                    verticalAlign: 'top',
                    color: '#333333',
                    lineHeight: '16px',
                  }}
                >
                  {alert.deterioratingActions}
                </td>
              </tr>

              {/* Stable row */}
              <tr>
                <td
                  style={{
                    border: '1px solid #999',
                    padding: '6px 8px',
                    verticalAlign: 'top',
                    color: '#333333',
                    lineHeight: '16px',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                    Stable
                  </div>
                  <div style={{ fontStyle: 'italic', color: '#555555' }}>
                    None of the 3 deteriorating factors above
                  </div>
                </td>
                <td
                  style={{
                    border: '1px solid #999',
                    padding: '6px 8px',
                    verticalAlign: 'top',
                    color: '#333333',
                    lineHeight: '16px',
                  }}
                >
                  {alert.stableActions}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Sepsis screening prompt */}
          {alert.showSepsisPrompt && (
            <div
              style={{
                fontWeight: 700,
                color: '#dc3545',
                fontSize: '11px',
                lineHeight: '16px',
                fontFamily: FONT_FAMILY,
                marginBottom: '4px',
              }}
            >
              Could it be SEPSIS? If yes: follow Queensland Sepsis Care Pathway
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid #ccc',
            textAlign: 'right',
            backgroundColor: '#f5f5f5',
          }}
        >
          <button
            type="button"
            onClick={onDismiss}
            style={{
              padding: '5px 20px',
              fontSize: '11px',
              fontFamily: FONT_FAMILY,
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#0066b2',
              border: '1px solid #004578',
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
