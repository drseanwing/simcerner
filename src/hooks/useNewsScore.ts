/**
 * @file useNewsScore.ts
 * @description React hook for Q-ADDS EWS score calculations.
 *
 * Accepts a patient's vital sign history and returns the latest Q-ADDS EWS
 * score, clinical risk level, and a trend indicator showing whether the
 * patient's condition is improving, stable, or worsening.
 */

import { useMemo } from 'react';
import type { VitalSign } from '../types/patient';
import type { QADDSResult, QADDSRiskLevel } from '../types/news';
import { calculateQADDS } from '../services/newsCalculator';

// ---------------------------------------------------------------------------
// Trend Type
// ---------------------------------------------------------------------------

/** Trend direction derived from consecutive Q-ADDS EWS scores. */
export type NewsTrend = 'improving' | 'stable' | 'worsening';

// ---------------------------------------------------------------------------
// Hook Return Type
// ---------------------------------------------------------------------------

/** Shape returned by the {@link useNewsScore} hook. */
export interface UseNewsScoreResult {
  /** Q-ADDS EWS result for the most recent observation, or null if no vitals. */
  latestScore: QADDSResult | null;

  /** Clinical risk level for the most recent observation. */
  riskLevel: QADDSRiskLevel | null;

  /** Trend direction over the last two observations. */
  trend: NewsTrend;

  /** Q-ADDS EWS results for all vitals (newest first), for charting. */
  scoreHistory: QADDSResult[];

  /** Whether any vital sign parameter triggered the E-zone (MET call criteria). */
  hasEZone: boolean;

  /** Names of parameters that are in the E-zone, if any. */
  eZoneParameters: string[];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that computes Q-ADDS EWS scores from a patient's vital signs.
 *
 * All calculations are memoised — results only recompute when the
 * `vitals` array reference changes.
 *
 * @param vitals - Array of vital sign observations (newest first).
 * @returns Latest score, risk level, trend, full score history, and E-zone flags.
 *
 * @example
 * ```tsx
 * const { latestScore, riskLevel, trend, hasEZone } = useNewsScore(patient.vitals);
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
        hasEZone: false,
        eZoneParameters: [],
      };
    }

    // Calculate Q-ADDS EWS for every observation set
    const scoreHistory = vitals.map((v) => calculateQADDS(v));

    const latestScore = scoreHistory[0];
    const riskLevel = latestScore.riskLevel;

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
      hasEZone: latestScore.hasEZone,
      eZoneParameters: latestScore.eZoneParameters,
    };
  }, [vitals]);
}

/** Alias for {@link useNewsScore} using Q-ADDS EWS naming. */
export const useEWSScore = useNewsScore;
