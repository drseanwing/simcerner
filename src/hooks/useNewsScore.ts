/**
 * @file useNewsScore.ts
 * @description React hook for NEWS2 score calculations.
 *
 * Accepts a patient's vital sign history and returns the latest NEWS2
 * score, clinical risk level, and a trend indicator showing whether the
 * patient's condition is improving, stable, or worsening.
 */

import { useMemo } from 'react';
import type { VitalSign } from '../types/patient';
import type { NEWS2Result, ClinicalRisk } from '../types/news';
import { calculateNEWS2 } from '../services/newsCalculator';

// ---------------------------------------------------------------------------
// Trend Type
// ---------------------------------------------------------------------------

/** Trend direction derived from consecutive NEWS2 scores. */
export type NewsTrend = 'improving' | 'stable' | 'worsening';

// ---------------------------------------------------------------------------
// Hook Return Type
// ---------------------------------------------------------------------------

/** Shape returned by the {@link useNewsScore} hook. */
export interface UseNewsScoreResult {
  /** NEWS2 result for the most recent observation, or null if no vitals. */
  latestScore: NEWS2Result | null;

  /** Clinical risk level for the most recent observation. */
  riskLevel: ClinicalRisk | null;

  /** Trend direction over the last two observations. */
  trend: NewsTrend;

  /** NEWS2 results for all vitals (newest first), for charting. */
  scoreHistory: NEWS2Result[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that computes NEWS2 scores from a patient's vital signs.
 *
 * All calculations are memoised — results only recompute when the
 * `vitals` array reference changes.
 *
 * @param vitals - Array of vital sign observations (newest first).
 * @returns Latest score, risk level, trend, and full score history.
 *
 * @example
 * ```tsx
 * const { latestScore, riskLevel, trend } = useNewsScore(patient.vitals);
 * ```
 */
export function useNewsScore(vitals: VitalSign[]): UseNewsScoreResult {
  return useMemo(() => {
    if (!vitals || vitals.length === 0) {
      return {
        latestScore: null,
        riskLevel: null,
        trend: 'stable' as NewsTrend,
        scoreHistory: [],
      };
    }

    // Calculate NEWS2 for every observation set
    const scoreHistory = vitals.map((v) => calculateNEWS2(v));

    const latestScore = scoreHistory[0];
    const riskLevel = latestScore.clinicalRisk;

    // Derive trend from the two most recent scores
    let trend: NewsTrend = 'stable';
    if (scoreHistory.length >= 2) {
      const current = scoreHistory[0].totalScore;
      const previous = scoreHistory[1].totalScore;
      const delta = current - previous;

      if (delta > 0) {
        trend = 'worsening';
      } else if (delta < 0) {
        trend = 'improving';
      }
      // delta === 0 → stable (default)
    }

    return {
      latestScore,
      riskLevel,
      trend,
      scoreHistory,
    };
  }, [vitals]);
}
