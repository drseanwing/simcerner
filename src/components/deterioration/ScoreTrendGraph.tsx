/**
 * @file ScoreTrendGraph.tsx
 * @description Line graph showing NEWS2 score over time using Recharts.
 *
 * Displays:
 * - X-axis: observation date/time
 * - Y-axis: NEWS2 score (0–20)
 * - Colour zones: green (0–4), yellow (5–6), red (7+)
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
import { calculateNEWS2 } from '../../services/newsCalculator';
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
 * ScoreTrendGraph renders a line chart of NEWS2 aggregate scores over time
 * with colour-coded background zones indicating clinical risk tiers.
 */
export default function ScoreTrendGraph({ vitals }: ScoreTrendGraphProps) {
  /** Transform vitals into chronological chart data. */
  const data = useMemo<TrendDataPoint[]>(() => {
    if (!vitals?.length) return [];
    return [...vitals]
      .reverse()
      .map((v) => ({
        time: v.datetime,
        score: calculateNEWS2(v).totalScore,
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
      <div className="score-trend-graph__title">NEWS2 Score Trend</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

          {/* Risk zone backgrounds */}
          <ReferenceArea y1={0} y2={4} fill="#e8f5e9" fillOpacity={0.5} />
          <ReferenceArea y1={4} y2={6} fill="#fff8e1" fillOpacity={0.5} />
          <ReferenceArea y1={6} y2={20} fill="#fef2f2" fillOpacity={0.5} />

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
            label={{ value: 'NEWS2', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: number | undefined) => [`Score: ${value ?? 0}`, 'NEWS2']}
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
