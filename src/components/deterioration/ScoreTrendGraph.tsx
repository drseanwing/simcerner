/**
 * @file ScoreTrendGraph.tsx
 * @description Line graph showing EWS score over time using Recharts.
 *
 * Displays:
 * - X-axis: observation date/time
 * - Y-axis: EWS score (0–20)
 * - Colour zones (Q-ADDS): green (0–1), yellow (1–4), orange (4–6),
 *   deep-orange (6–8), purple (8–20)
 * - Data points from patient vital signs history
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
import type { VitalSign } from '../../types';
import { calculateQADDS } from '../../services/newsCalculator';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by ScoreTrendGraph. */
export interface ScoreTrendGraphProps {
  /** Vital sign observations (most recent first). */
  vitals: VitalSign[];
}

/** Internal data point for the chart. */
interface TrendDataPoint {
  time: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ScoreTrendGraph renders a line chart of EWS aggregate scores over time
 * with colour-coded background zones indicating Q-ADDS clinical risk tiers.
 */
export default function ScoreTrendGraph({ vitals }: ScoreTrendGraphProps) {
  /** Transform vitals into chronological chart data. */
  const data = useMemo<TrendDataPoint[]>(() => {
    if (!vitals?.length) return [];
    return [...vitals]
      .reverse()
      .map((v) => ({
        time: v.datetime,
        score: calculateQADDS(v).totalScore,
      }));
  }, [vitals]);

  if (data.length === 0) {
    return (
      <div className="text-muted" style={{ padding: 20, textAlign: 'center' }}>
        No data available for trend graph
      </div>
    );
  }

  return (
    <div className="score-trend-graph">
      <div className="score-trend-graph__title">EWS Score Trend</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

          {/* Q-ADDS risk zone backgrounds */}
          <ReferenceArea y1={0} y2={1} fill="#e8f5e9" fillOpacity={0.5} />
          <ReferenceArea y1={1} y2={4} fill="#fff8e1" fillOpacity={0.5} />
          <ReferenceArea y1={4} y2={6} fill="#fff3e0" fillOpacity={0.5} />
          <ReferenceArea y1={6} y2={8} fill="#ffe0b2" fillOpacity={0.5} />
          <ReferenceArea y1={8} y2={20} fill="#f3e5f5" fillOpacity={0.5} />

          <XAxis
            dataKey="time"
            tick={{ fontSize: 10 }}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis
            domain={[0, 20]}
            tick={{ fontSize: 10 }}
            label={{ value: 'EWS', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: number | undefined) => [`Score: ${value ?? 0}`, 'EWS']}
            labelStyle={{ fontSize: 10 }}
            contentStyle={{ fontSize: 11 }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#0066b2"
            strokeWidth={2}
            dot={{ r: 4, fill: '#0066b2' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
