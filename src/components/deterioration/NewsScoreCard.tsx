/**
 * @file NewsScoreCard.tsx
 * @description Displays the aggregate NEWS2/Q-ADDS score with colour-coded
 * background, clinical risk level badge, scoring system toggle, and
 * individual sub-score breakdown.
 *
 * Colour mapping:
 * - Green  (0–4): Low risk
 * - Yellow (5–6): Medium risk
 * - Red    (≥7):  High risk
 */

import { useState } from 'react';
import type { NEWS2Result, NEWS2SubScore } from '../../types';
import { ScoringSystem } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by the NewsScoreCard component. */
export interface NewsScoreCardProps {
  /** Computed NEWS2 result for the most recent vital signs. */
  result: NEWS2Result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the background colour for a given aggregate score.
 * Green 0–4, yellow 5–6, red ≥7.
 */
function getScoreColour(score: number): string {
  if (score >= 7) return '#f44336';
  if (score >= 5) return '#ff9800';
  return '#4caf50';
}

/**
 * Return the text colour appropriate for the score background.
 */
function getScoreTextColour(score: number): string {
  if (score >= 5) return '#ffffff';
  return '#ffffff';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * NewsScoreCard renders a prominent card showing the aggregate early warning
 * score with colour-coded severity, risk badge, and sub-score breakdown.
 */
export default function NewsScoreCard({ result }: NewsScoreCardProps) {
  const [system, setSystem] = useState<ScoringSystem>(ScoringSystem.NEWS2);

  const bgColour = getScoreColour(result.totalScore);
  const textColour = getScoreTextColour(result.totalScore);

  return (
    <div className="news-score-card">
      {/* Large score display */}
      <div
        className="news-score-card__score"
        style={{ backgroundColor: bgColour, color: textColour }}
      >
        <span className="news-score-card__number">{result.totalScore}</span>
        <span className="news-score-card__risk-badge">
          {result.clinicalRisk}
        </span>
      </div>

      {/* Scoring system selector */}
      <div className="news-score-card__system-toggle">
        <button
          className={`btn btn-sm${system === ScoringSystem.NEWS2 ? ' btn-primary' : ''}`}
          onClick={() => setSystem(ScoringSystem.NEWS2)}
        >
          NEWS2
        </button>
        <button
          className={`btn btn-sm${system === ScoringSystem.QADDS ? ' btn-primary' : ''}`}
          onClick={() => setSystem(ScoringSystem.QADDS)}
        >
          Q-ADDS
        </button>
      </div>

      {/* Sub-score breakdown */}
      <div className="news-score-card__breakdown">
        <div className="news-score-card__breakdown-title">Sub-Score Breakdown</div>
        <ul className="news-score-card__breakdown-list">
          {result.subScores.map((sub: NEWS2SubScore) => (
            <li key={sub.parameter} className="news-score-card__breakdown-item">
              <span className="news-score-card__param-name">{sub.parameter}</span>
              <span className="news-score-card__param-value">
                {String(sub.value)}
              </span>
              <span
                className="news-score-card__param-score"
                style={{
                  backgroundColor: `var(--news-score-${sub.score})`,
                  color: sub.score >= 2 ? 'var(--news-score-text-light)' : 'var(--news-score-text-dark)',
                }}
              >
                {sub.score}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
