/**
 * @file VitalsGraphView.tsx
 * @description Graphical vital signs view using Recharts line charts.
 *
 * Migrated from the canvas-based VitalsGraphView in emr-sim-v2.html.
 * Renders four graphs:
 * - Respiratory Rate
 * - SpO2
 * - Blood Pressure (Systolic)
 * - Heart Rate
 *
 * Each graph includes:
 * - Normal range shading (light green) and abnormal zones (light red)
 * - Line chart with data point dots
 * - Responsive container for auto-sizing
 */

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';
import { usePatientStore } from '../../stores/patientStore';
import type { VitalSign } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Configuration for a single vital sign graph. */
interface GraphConfig {
  title: string;
  parameter: keyof VitalSign;
  unit: string;
  normalRange: { min: number; max: number };
}

/** Internal chart data point. */
interface GraphDataPoint {
  time: string;
  value: number | null;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Graph configurations for each vital parameter. */
const GRAPHS: GraphConfig[] = [
  {
    title: 'RR (Respiratory Rate)',
    parameter: 'rr',
    unit: '/min',
    normalRange: { min: 12, max: 20 },
  },
  {
    title: 'SpO2',
    parameter: 'spo2',
    unit: '%',
    normalRange: { min: 95, max: 100 },
  },
  {
    title: 'Blood Pressure (Systolic)',
    parameter: 'bp_sys',
    unit: 'mmHg',
    normalRange: { min: 100, max: 140 },
  },
  {
    title: 'Heart Rate',
    parameter: 'hr',
    unit: 'bpm',
    normalRange: { min: 60, max: 100 },
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * VitalsGraphView renders Recharts-based line graphs for key vital
 * sign parameters with normal range shading.
 */
export default function VitalsGraphView() {
  const patient = usePatientStore((s) => s.currentPatient);

  if (!patient?.vitals?.length) {
    return (
      <>
        <div className="content-header">Adult Q-ADDS - Graphical View</div>
        <div className="content-body">
          <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
            No vital signs data available for graphical display
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="content-header">Adult Q-ADDS - Graphical View</div>
      <div className="content-body">
        <div className="vitals-graph-container">
          {GRAPHS.map((config) => (
            <VitalSignGraph
              key={config.parameter}
              config={config}
              vitals={patient.vitals}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * VitalSignGraph renders a single Recharts LineChart for one vital parameter.
 */
function VitalSignGraph({
  config,
  vitals,
}: {
  config: GraphConfig;
  vitals: VitalSign[];
}) {
  /** Transform vitals to chronological chart data. */
  const data = useMemo<GraphDataPoint[]>(() => {
    return [...vitals].reverse().map((v) => ({
      time: v.datetime,
      value: v[config.parameter] != null ? Number(v[config.parameter]) : null,
    }));
  }, [vitals, config.parameter]);

  /** Compute Y-axis domain with padding. */
  const yDomain = useMemo<[number, number]>(() => {
    const values = data.map((d) => d.value).filter((v): v is number => v != null);
    if (values.length === 0) return [0, 100];
    const min = Math.min(...values, config.normalRange.min);
    const max = Math.max(...values, config.normalRange.max);
    const padding = (max - min) * 0.15 || 5;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [data, config.normalRange]);

  return (
    <div className="vital-graph">
      <div className="graph-title">
        {config.title} ({config.unit})
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

          {/* Abnormal zone above normal range */}
          <ReferenceArea
            y1={config.normalRange.max}
            y2={yDomain[1]}
            fill="rgba(255, 182, 193, 0.3)"
          />

          {/* Normal range zone */}
          <ReferenceArea
            y1={config.normalRange.min}
            y2={config.normalRange.max}
            fill="rgba(200, 230, 200, 0.3)"
          />

          {/* Abnormal zone below normal range */}
          <ReferenceArea
            y1={yDomain[0]}
            y2={config.normalRange.min}
            fill="rgba(255, 182, 193, 0.3)"
          />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 9 }}
            angle={-25}
            textAnchor="end"
            height={45}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 9 }}
          />
          <Tooltip
            formatter={(value: number | undefined) => [`${value ?? 0} ${config.unit}`, config.title]}
            labelStyle={{ fontSize: 10 }}
            contentStyle={{ fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0066b2"
            strokeWidth={2}
            dot={{ r: 4, fill: '#0066b2' }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
