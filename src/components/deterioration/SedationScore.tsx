/**
 * Sedation Score Section — displays sedation score reference table and
 * assessment timeline on the Managing Deterioration page.
 *
 * Shows:
 *   - Collapsible section header with "[Add]" link
 *   - Reference table of all 4 sedation levels with labels, actions, and colour coding
 *   - Warning about sedation score not being added to Q-ADDS
 *   - Timeline of recorded assessments (most recent first)
 */

import { useState } from 'react'
import type { SedationLevel } from '@/types/meo'
import { SEDATION_LABELS, SEDATION_ACTIONS } from '@/types/meo'

interface SedationScoreProps {
  assessments: Array<{
    assessmentTime: string
    score: 0 | 1 | 2 | 3
    comments: string | null
  }>
}

const FONT_FAMILY = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

/** Background colours for each sedation level */
const LEVEL_COLORS: Record<SedationLevel, string> = {
  0: '#e8f5e9',
  1: '#fff3cd',
  2: '#ffd699',
  3: '#f8d7da',
}

/** Short labels for the score column */
const LEVEL_SHORT_LABELS: Record<SedationLevel, string> = {
  0: 'Awake',
  1: 'Mild',
  2: 'Moderate',
  3: 'Severe',
}

const ALL_LEVELS: SedationLevel[] = [0, 1, 2, 3]

/**
 * Formats an ISO datetime into Cerner-style: "HH:mm DD/MM/YYYY"
 */
function formatAssessmentTime(iso: string): string {
  const date = new Date(iso)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${hours}:${minutes} ${day}/${month}/${year}`
}

export function SedationScore({ assessments }: SedationScoreProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Sort assessments by time, most recent first
  const sortedAssessments = [...assessments].sort(
    (a, b) => new Date(b.assessmentTime).getTime() - new Date(a.assessmentTime).getTime(),
  )

  return (
    <div
      style={{
        borderBottom: '1px solid #ddd',
        fontFamily: FONT_FAMILY,
        fontSize: '11px',
        marginBottom: '12px',
      }}
    >
      {/* Header row with toggle and Add link */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
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
          aria-label={collapsed ? 'Expand Sedation Score section' : 'Collapse Sedation Score section'}
        >
          {collapsed ? '\u25B6' : '\u25BC'} Sedation Score
        </button>

        {/* Add link (non-functional placeholder) */}
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: FONT_FAMILY,
            fontSize: '11px',
            color: '#0066b2',
            textDecoration: 'underline',
            lineHeight: '16px',
          }}
        >
          Add
        </button>
      </div>

      {/* Collapsible content */}
      {!collapsed && (
        <div style={{ padding: '0 0 10px 0' }}>
          {/* Reference table: all 4 sedation levels */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              fontFamily: FONT_FAMILY,
              marginBottom: '10px',
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    border: '1px solid #999',
                    padding: '5px 8px',
                    backgroundColor: '#f0f0f0',
                    textAlign: 'left',
                    fontWeight: 700,
                    width: '10%',
                  }}
                >
                  Score
                </th>
                <th
                  style={{
                    border: '1px solid #999',
                    padding: '5px 8px',
                    backgroundColor: '#f0f0f0',
                    textAlign: 'left',
                    fontWeight: 700,
                    width: '30%',
                  }}
                >
                  Level
                </th>
                <th
                  style={{
                    border: '1px solid #999',
                    padding: '5px 8px',
                    backgroundColor: '#f0f0f0',
                    textAlign: 'left',
                    fontWeight: 700,
                    width: '60%',
                  }}
                >
                  Required Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {ALL_LEVELS.map((level) => (
                <tr key={level}>
                  <td
                    style={{
                      border: '1px solid #999',
                      padding: '5px 8px',
                      backgroundColor: LEVEL_COLORS[level],
                      fontWeight: 700,
                      textAlign: 'center',
                      color: '#333333',
                    }}
                  >
                    {level}
                  </td>
                  <td
                    style={{
                      border: '1px solid #999',
                      padding: '5px 8px',
                      backgroundColor: LEVEL_COLORS[level],
                      color: '#333333',
                      lineHeight: '16px',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{LEVEL_SHORT_LABELS[level]}</span>
                    <br />
                    <span style={{ fontSize: '10px', color: '#555555' }}>
                      {SEDATION_LABELS[level]}
                    </span>
                  </td>
                  <td
                    style={{
                      border: '1px solid #999',
                      padding: '5px 8px',
                      backgroundColor: LEVEL_COLORS[level],
                      color: '#333333',
                      lineHeight: '16px',
                    }}
                  >
                    {level === 3 && (
                      <span
                        style={{
                          fontWeight: 700,
                          color: '#dc3545',
                          display: 'block',
                          marginBottom: '2px',
                        }}
                      >
                        EMERGENCY
                      </span>
                    )}
                    {SEDATION_ACTIONS[level]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Warning banner */}
          <div
            style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '3px',
              padding: '6px 10px',
              marginBottom: '10px',
              fontFamily: FONT_FAMILY,
              fontSize: '11px',
              color: '#856404',
              fontWeight: 600,
              lineHeight: '16px',
            }}
          >
            WARNING: Sedation Score is NOT added to Q-ADDS Score. However, Sedation Score of 3
            triggers Emergency Call.
          </div>

          {/* Assessment timeline (most recent first) */}
          {sortedAssessments.length > 0 && (
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: 'var(--cerner-dark-blue, #004578)',
                  marginBottom: '6px',
                  fontSize: '11px',
                }}
              >
                Assessment History
              </div>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  fontFamily: FONT_FAMILY,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: '1px solid #999',
                        padding: '4px 8px',
                        backgroundColor: '#f0f0f0',
                        textAlign: 'left',
                        fontWeight: 700,
                        width: '30%',
                      }}
                    >
                      Time
                    </th>
                    <th
                      style={{
                        border: '1px solid #999',
                        padding: '4px 8px',
                        backgroundColor: '#f0f0f0',
                        textAlign: 'center',
                        fontWeight: 700,
                        width: '15%',
                      }}
                    >
                      Score
                    </th>
                    <th
                      style={{
                        border: '1px solid #999',
                        padding: '4px 8px',
                        backgroundColor: '#f0f0f0',
                        textAlign: 'left',
                        fontWeight: 700,
                        width: '55%',
                      }}
                    >
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAssessments.map((assessment, index) => (
                    <tr key={index}>
                      <td
                        style={{
                          border: '1px solid #999',
                          padding: '4px 8px',
                          color: '#333333',
                        }}
                      >
                        {formatAssessmentTime(assessment.assessmentTime)}
                      </td>
                      <td
                        style={{
                          border: '1px solid #999',
                          padding: '4px 8px',
                          textAlign: 'center',
                          fontWeight: 700,
                          backgroundColor: LEVEL_COLORS[assessment.score],
                          color: '#333333',
                        }}
                      >
                        {assessment.score} - {LEVEL_SHORT_LABELS[assessment.score]}
                      </td>
                      <td
                        style={{
                          border: '1px solid #999',
                          padding: '4px 8px',
                          color: '#333333',
                          fontStyle: assessment.comments ? 'normal' : 'italic',
                        }}
                      >
                        {assessment.comments ?? 'No comments'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
