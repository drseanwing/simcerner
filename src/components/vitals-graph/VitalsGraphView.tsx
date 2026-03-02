import { useEffect, useRef } from 'react'
import type { Patient, VitalSign } from '@/types/patient'

interface NormalRange {
  min: number
  max: number
}

interface VitalSignGraphProps {
  title: string
  data: VitalSign[]
  parameter: keyof VitalSign
  normalRange: NormalRange
  unit: string
}

function VitalSignGraph({
  title,
  data,
  parameter,
  normalRange,
  unit,
}: VitalSignGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data || data.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    const values = data
      .map((d) => parseFloat(String(d[parameter])))
      .reverse()
    const maxVal = Math.max(...values, normalRange.max)
    const minVal = Math.min(...values, normalRange.min)
    const range = maxVal - minVal
    const padding = range * 0.1

    const drawZone = (yStart: number, yEnd: number, color: string) => {
      const y1 =
        height -
        ((yStart - (minVal - padding)) / (range + 2 * padding)) * height
      const y2 =
        height -
        ((yEnd - (minVal - padding)) / (range + 2 * padding)) * height
      ctx.fillStyle = color
      ctx.fillRect(0, y2, width, y1 - y2)
    }

    drawZone(maxVal + padding, normalRange.max, 'rgba(255, 182, 193, 0.3)')
    drawZone(normalRange.max, normalRange.min, 'rgba(255, 255, 224, 0.3)')
    drawZone(normalRange.min, minVal - padding, 'rgba(255, 182, 193, 0.3)')

    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    ctx.strokeStyle = '#0066b2'
    ctx.lineWidth = 2
    ctx.beginPath()

    values.forEach((val, i) => {
      const x =
        values.length > 1 ? (width / (values.length - 1)) * i : width / 2
      const y =
        height -
        ((val - (minVal - padding)) / (range + 2 * padding)) * height

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    values.forEach((val, i) => {
      const x =
        values.length > 1 ? (width / (values.length - 1)) * i : width / 2
      const y =
        height -
        ((val - (minVal - padding)) / (range + 2 * padding)) * height

      ctx.fillStyle =
        val < normalRange.min || val > normalRange.max ? '#dc3545' : '#0066b2'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })
  }, [data, parameter, normalRange])

  return (
    <div className="vital-graph">
      <div className="graph-title">
        {title} ({unit})
      </div>
      <canvas
        ref={canvasRef}
        className="graph-canvas"
        width={800}
        height={120}
      />
    </div>
  )
}

interface VitalsGraphViewProps {
  patient: Patient
}

export function VitalsGraphView({ patient }: VitalsGraphViewProps) {
  if (!patient.vitals || patient.vitals.length === 0) {
    return (
      <>
        <div className="content-header">
          {'\uD83D\uDCC8'} Adult Q-ADDS - Graphical View
        </div>
        <div className="content-body">
          <div
            className="text-muted"
            style={{ padding: '20px', textAlign: 'center' }}
          >
            No vital signs data available for graphical display
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="content-header">
        {'\uD83D\uDCC8'} Adult Q-ADDS - Graphical View
      </div>
      <div className="content-body">
        <div className="vitals-graph-container">
          <VitalSignGraph
            title="RR (bpm)"
            data={patient.vitals}
            parameter="rr"
            normalRange={{ min: 12, max: 20 }}
            unit="/min"
          />
          <VitalSignGraph
            title="SpO2 (%)"
            data={patient.vitals}
            parameter="spo2"
            normalRange={{ min: 95, max: 100 }}
            unit="%"
          />
          <VitalSignGraph
            title="Blood Pressure (SBP)"
            data={patient.vitals}
            parameter="bp_sys"
            normalRange={{ min: 100, max: 140 }}
            unit="mmHg"
          />
          <VitalSignGraph
            title="Heart Rate"
            data={patient.vitals}
            parameter="hr"
            normalRange={{ min: 60, max: 100 }}
            unit="bpm"
          />
        </div>
      </div>
    </>
  )
}
