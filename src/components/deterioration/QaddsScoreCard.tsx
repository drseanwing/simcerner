import { useMemo } from 'react'
import type { VitalSign } from '@/types/patient'
import { calculateQadds, getRiskColor, getEscalationText } from '@/services/qaddsCalculator'

interface QaddsScoreCardProps {
  vitals: VitalSign
}

const RISK_BADGE_COLORS: Record<string, string> = {
  Routine: '#ffffff',
  Low: '#fff3cd',
  Moderate: '#ffd699',
  High: '#f8d7da',
  Emergency: '#d5a6e6',
}

const RISK_TEXT_COLORS: Record<string, string> = {
  Routine: '#333333',
  Low: '#856404',
  Moderate: '#7a4100',
  High: '#721c24',
  Emergency: '#4a1a6b',
}

export function QaddsScoreCard({ vitals }: QaddsScoreCardProps) {
  const qaddsScore = useMemo(() => calculateQadds(vitals), [vitals])
  const riskColor = getRiskColor(qaddsScore.clinicalRisk)
  const escalationText = getEscalationText(qaddsScore.clinicalRisk)
  const badgeBg = RISK_BADGE_COLORS[qaddsScore.clinicalRisk] ?? '#ffffff'
  const badgeText = RISK_TEXT_COLORS[qaddsScore.clinicalRisk] ?? '#333333'

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
      {/* Header */}
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
        Q-ADDS Score
      </div>

      {/* Body */}
      <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Large Score Number */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '6px',
            backgroundColor: riskColor,
            border: '2px solid var(--cerner-border, #ccc)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#333333',
              lineHeight: 1,
            }}
          >
            {qaddsScore.totalScore}
          </span>
        </div>

        {/* Risk Details */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Risk Level Badge */}
          <div style={{ marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: '3px',
                backgroundColor: badgeBg,
                color: badgeText,
                fontWeight: 600,
                fontSize: '11px',
                border: '1px solid ' + (qaddsScore.clinicalRisk === 'Routine' ? '#ccc' : badgeText),
                lineHeight: '18px',
              }}
            >
              {qaddsScore.clinicalRisk}
            </span>
          </div>

          {/* MET Call Status */}
          {qaddsScore.hasEmergency && (
            <div
              style={{
                color: '#721c24',
                fontWeight: 700,
                fontSize: '11px',
                marginBottom: '4px',
              }}
            >
              MET CALL REQUIRED
              {qaddsScore.emergencyParameters.length > 0 && (
                <span style={{ fontWeight: 400, marginLeft: '6px' }}>
                  (E-trigger: {qaddsScore.emergencyParameters.join(', ')})
                </span>
              )}
            </div>
          )}

          {/* Escalation Text */}
          <div style={{ color: '#555555', fontSize: '11px', lineHeight: '15px' }}>
            {escalationText}
          </div>
        </div>
      </div>
    </div>
  )
}
