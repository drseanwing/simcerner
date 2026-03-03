/**
 * MEO Plan Section — displays MET-MEO Plan status on the Managing Deterioration page.
 *
 * Sits between the EW Score Graph and Sedation Score sections.
 * Shows a collapsible section with:
 *   - A hyperlink to open the MEO Plan dialog
 *   - When an active MET-MEO exists: expiry date/time and acceptable VS range
 *   - When no active MET-MEO: the data table is hidden
 */

import { useState } from 'react'

interface MeoPlanSectionProps {
  activeMetMeo: {
    expiresAt: string
    eZoneVitalSign: string | null
    eZoneLowerBound: number | null
    eZoneUpperBound: number | null
    status: string
  } | null
  onOpenDialog: () => void
}

const FONT_FAMILY = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

/** Vital sign display labels for the acceptable range row */
const VS_DISPLAY_LABELS: Record<string, string> = {
  rr: 'RR',
  systolicBP: 'SBP',
  heartRate: 'HR',
  consciousness: 'CAVPU',
}

/**
 * Formats an ISO datetime string into Cerner-style display: "HHmm DD MMM"
 * e.g. "1900 25 Jan"
 */
function formatExpiryDate(iso: string): string {
  const date = new Date(iso)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const day = date.getDate()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = monthNames[date.getMonth()]
  return `${hours}${minutes} ${day} ${month}`
}

/**
 * Formats the acceptable VS range string, e.g. "HR 60-170"
 */
function formatAcceptableRange(
  vitalSign: string | null,
  lower: number | null,
  upper: number | null,
): string | null {
  if (vitalSign === null) return null
  const label = VS_DISPLAY_LABELS[vitalSign] ?? vitalSign
  if (lower !== null && upper !== null) {
    return `${label} ${lower}-${upper}`
  }
  return label
}

export function MeoPlanSection({ activeMetMeo, onOpenDialog }: MeoPlanSectionProps) {
  const [collapsed, setCollapsed] = useState(false)

  const acceptableRange = activeMetMeo
    ? formatAcceptableRange(
        activeMetMeo.eZoneVitalSign,
        activeMetMeo.eZoneLowerBound,
        activeMetMeo.eZoneUpperBound,
      )
    : null

  return (
    <div
      style={{
        borderBottom: '1px solid #ddd',
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        marginBottom: '12px',
      }}
    >
      {/* Header row with toggle and link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px',
          padding: '8px 0',
        }}
      >
        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--cerner-dark-blue, #004578)',
            lineHeight: '16px',
            flexShrink: 0,
          }}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand MEO Plan section' : 'Collapse MEO Plan section'}
        >
          {collapsed ? '\u25B6' : '\u25BC'} MEO Plan
        </button>

        {/* Link to open MEO Plan dialog */}
        <button
          type="button"
          onClick={onOpenDialog}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            color: '#0066b2',
            textDecoration: 'underline',
            textAlign: 'left',
            lineHeight: '16px',
          }}
        >
          Add Modified Observations, Post MET-MEO orders and nursing instructions
        </button>
      </div>

      {/* Collapsible content */}
      {!collapsed && activeMetMeo !== null && (
        <div style={{ padding: '0 0 10px 18px' }}>
          <table
            style={{
              borderCollapse: 'collapse',
              fontSize: '11px',
              fontFamily: FONT_FAMILY,
            }}
          >
            <tbody>
              {/* MET-MEO expiry row */}
              <tr>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '4px 10px',
                    fontWeight: 600,
                    color: '#333333',
                    whiteSpace: 'nowrap',
                  }}
                >
                  MET-MEO expiry
                </td>
                <td
                  style={{
                    border: '1px solid #ccc',
                    padding: '4px 10px',
                    color: '#333333',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatExpiryDate(activeMetMeo.expiresAt)}
                </td>
              </tr>

              {/* Acceptable VS range row */}
              {acceptableRange !== null && (
                <tr>
                  <td
                    style={{
                      border: '1px solid #ccc',
                      padding: '4px 10px',
                      fontWeight: 600,
                      color: '#333333',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    MET-MEO VS acceptable range
                  </td>
                  <td
                    style={{
                      border: '1px solid #ccc',
                      padding: '4px 10px',
                      color: '#333333',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {acceptableRange}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
