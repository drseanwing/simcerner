import { useRef, useEffect, useMemo } from 'react'
import type { VitalSign } from '@/types/patient'
import { calculateQaddsTrend } from '@/services/qaddsCalculator'
import type { ChartVariant, ClinicalRisk } from '@/types/vitals'

interface ScoreTrendGraphProps {
  vitals: VitalSign[]
  variant?: ChartVariant
}

/** Threshold lines to draw on the graph. */
interface ThresholdLine {
  score: number
  color: string
  label: string
}

const THRESHOLDS: ThresholdLine[] = [
  { score: 1, color: '#CCCC00', label: 'Low (1)' },
  { score: 4, color: '#FFB347', label: 'Moderate (4)' },
  { score: 6, color: '#FFA500', label: 'High (6)' },
  { score: 8, color: '#B366CC', label: 'Emergency (8)' },
]

/** Default Y-axis max; auto-scales upward if data exceeds this. */
const DEFAULT_MAX_SCORE = 15
const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 300
const PADDING = { top: 30, right: 100, bottom: 60, left: 50 }

function getRiskForScore(totalScore: number, hasEmergency: boolean): ClinicalRisk {
  if (hasEmergency || totalScore >= 8) return 'Emergency'
  if (totalScore >= 6) return 'High'
  if (totalScore >= 4) return 'Moderate'
  if (totalScore >= 1) return 'Low'
  return 'Routine'
}

function getDotColor(risk: ClinicalRisk): string {
  switch (risk) {
    case 'Routine':
      return '#28a745'
    case 'Low':
      return '#e6a817'
    case 'Moderate':
      return '#e67e22'
    case 'High':
      return '#dc3545'
    case 'Emergency':
      return '#7b2d8e'
  }
}

export function ScoreTrendGraph({ vitals, variant }: ScoreTrendGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Sort vitals chronologically (oldest first) for plotting
  const chronologicalVitals = useMemo(
    () => [...vitals].sort((a, b) => {
      const da = new Date(a.datetime).getTime()
      const db = new Date(b.datetime).getTime()
      return da - db
    }),
    [vitals],
  )

  const trendData = useMemo(
    () => calculateQaddsTrend(chronologicalVitals, variant),
    [chronologicalVitals, variant],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Scale for high-DPI displays
    const dpr = window.devicePixelRatio || 1
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    ctx.scale(dpr, dpr)

    const plotWidth = CANVAS_WIDTH - PADDING.left - PADDING.right
    const plotHeight = CANVAS_HEIGHT - PADDING.top - PADDING.bottom

    // Auto-scale Y-axis: use DEFAULT_MAX_SCORE unless data exceeds it
    const dataMax = trendData.reduce(
      (max, d) => Math.max(max, d.score.totalScore),
      0,
    )
    const yAxisMax = Math.max(DEFAULT_MAX_SCORE, dataMax + 2)

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Font setup
    ctx.font = "10px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"

    // Helper to map score to Y coordinate
    const scoreToY = (score: number): number => {
      return PADDING.top + plotHeight - (score / yAxisMax) * plotHeight
    }

    // -----------------------------------------------------------------------
    // Background colour zone bands (drawn first so everything layers on top)
    // Official Managing Deterioration page colours
    // -----------------------------------------------------------------------
    const colourBands: Array<{ minScore: number; maxScore: number; color: string }> = [
      { minScore: 0, maxScore: 1, color: '#90EE90' },   // Score 0: Green
      { minScore: 1, maxScore: 4, color: '#FFFF99' },   // Score 1-3: Pale yellow
      { minScore: 4, maxScore: 6, color: '#FFD699' },   // Score 4-5: Light orange
      { minScore: 6, maxScore: 8, color: '#FFC266' },   // Score 6-7: Orange
      { minScore: 8, maxScore: yAxisMax, color: '#E6B3FF' }, // Score >=8: Purple-pink
    ]

    ctx.save()
    ctx.globalAlpha = 0.35
    for (const band of colourBands) {
      const y1 = scoreToY(band.maxScore)
      const y2 = scoreToY(band.minScore)
      ctx.fillStyle = band.color
      ctx.fillRect(PADDING.left, y1, plotWidth, y2 - y1)
    }
    ctx.restore()

    // -----------------------------------------------------------------------
    // Y-axis gridlines and labels
    // -----------------------------------------------------------------------
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    ctx.fillStyle = '#666666'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    const gridStep = yAxisMax <= 15 ? 3 : 5
    for (let s = 0; s <= yAxisMax; s += gridStep) {
      const y = scoreToY(s)
      ctx.beginPath()
      ctx.moveTo(PADDING.left, y)
      ctx.lineTo(PADDING.left + plotWidth, y)
      ctx.stroke()
      ctx.fillText(String(s), PADDING.left - 6, y)
    }

    // Y-axis title
    ctx.save()
    ctx.translate(12, PADDING.top + plotHeight / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#333333'
    ctx.font = "bold 10px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    ctx.fillText('Q-ADDS Score', 0, 0)
    ctx.restore()

    // -----------------------------------------------------------------------
    // Threshold dashed lines
    // -----------------------------------------------------------------------
    for (const threshold of THRESHOLDS) {
      if (threshold.score > yAxisMax) continue
      const y = scoreToY(threshold.score)
      ctx.strokeStyle = threshold.color
      ctx.lineWidth = 1.5
      ctx.setLineDash([6, 3])
      ctx.beginPath()
      ctx.moveTo(PADDING.left, y)
      ctx.lineTo(PADDING.left + plotWidth, y)
      ctx.stroke()
      ctx.setLineDash([])

      // Label on the right
      ctx.fillStyle = threshold.color
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.font = "9px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      ctx.fillText(threshold.label, PADDING.left + plotWidth + 6, y)
    }

    // -----------------------------------------------------------------------
    // Axes
    // -----------------------------------------------------------------------
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(PADDING.left, PADDING.top)
    ctx.lineTo(PADDING.left, PADDING.top + plotHeight)
    ctx.lineTo(PADDING.left + plotWidth, PADDING.top + plotHeight)
    ctx.stroke()

    // -----------------------------------------------------------------------
    // Plot data points
    // -----------------------------------------------------------------------
    if (trendData.length === 0) {
      ctx.fillStyle = '#888888'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = "11px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      ctx.fillText(
        'No vital signs data to display',
        PADDING.left + plotWidth / 2,
        PADDING.top + plotHeight / 2,
      )
      return
    }

    // Calculate X positions
    const xStep = trendData.length > 1 ? plotWidth / (trendData.length - 1) : plotWidth / 2
    const points = trendData.map((d, i) => ({
      x: PADDING.left + (trendData.length > 1 ? i * xStep : plotWidth / 2),
      y: scoreToY(d.score.totalScore),
      score: d.score,
      datetime: d.datetime,
    }))

    // Connecting lines
    if (points.length > 1) {
      ctx.strokeStyle = '#0066b2'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.stroke()
    }

    // Dots coloured by risk level
    for (const point of points) {
      const risk = getRiskForScore(point.score.totalScore, point.score.hasEmergency)
      const dotColor = getDotColor(risk)

      ctx.beginPath()
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = dotColor
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Score label above dot
      ctx.fillStyle = '#333333'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'bottom'
      ctx.font = "bold 9px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      ctx.fillText(String(point.score.totalScore), point.x, point.y - 8)
    }

    // -----------------------------------------------------------------------
    // X-axis labels (datetime)
    // -----------------------------------------------------------------------
    ctx.fillStyle = '#666666'
    ctx.font = "9px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'

    const maxLabels = Math.min(points.length, Math.floor(plotWidth / 70) + 1)
    const labelStep = points.length <= maxLabels ? 1 : Math.ceil(points.length / maxLabels)

    for (let i = 0; i < points.length; i += labelStep) {
      const point = points[i]
      ctx.save()
      ctx.translate(point.x, PADDING.top + plotHeight + 6)
      ctx.rotate(Math.PI / 6)
      ctx.textAlign = 'left'
      ctx.fillText(point.datetime, 0, 0)
      ctx.restore()
    }

    // Title
    ctx.font = "bold 12px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = '#004578'
    ctx.fillText('Q-ADDS Score Trend', PADDING.left, 6)
  }, [trendData])

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
        No vital signs data available for trend display
      </div>
    )
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
        Q-ADDS Score Trend
      </div>
      <div style={{ padding: '8px', overflowX: 'auto' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: CANVAS_WIDTH + 'px',
            height: CANVAS_HEIGHT + 'px',
            display: 'block',
          }}
        />
      </div>
    </div>
  )
}
