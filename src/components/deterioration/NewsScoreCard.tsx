/**
 * @file NewsScoreCard.tsx
 * @description Displays the aggregate Q-ADDS score with colour-coded
 * background, clinical risk level badge, E-zone indicator, and
 * individual sub-score breakdown.
 *
 * Colour mapping (Q-ADDS 5-tier):
 * - Green   (0):   Normal
 * - Yellow  (1–3): Low
 * - Orange  (4–5): Moderate
 * - Deep-orange (6–7): High
 * - Purple  (≥8 or E-zone): MET
 */

import type { QADDSResult, QADDSSubScore, QADDSScore } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by the NewsScoreCard component. */
export interface NewsScoreCardProps {
  /** Computed Q-ADDS result for the most recent vital signs. */
  result: QADDSResult;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the background colour for a given aggregate score (Q-ADDS 5-tier).
 */
function getScoreColour(score: number): string {
  if (score >= 8) return '#9C27B0';   // purple — MET range
  if (score >= 6) return '#FF6D00';   // deep orange — High
  if (score >= 4) return '#FF9800';   // orange — Moderate
  if (score >= 1) return '#FDD835';   // yellow — Low
  return '#4caf50';                   // green — Normal
}

/**
 * Return the text colour appropriate for the score background.
 */
function getScoreTextColour(score: number): string {
  if (score >= 4) return '#ffffff';
  if (score >= 1) return '#333333';
  return '#ffffff';
}

/**
 * Map a Q-ADDS sub-score to a CSS variable level for background colouring.
 * 0→0 (green), 1→1 (yellow), 2→2 (orange), 3→3 (deep-orange), 4→4 (purple), E→4 (purple)
 */
function getSubScoreLevel(score: QADDSScore): number {
  if (score === 'E') return 4;
  return score;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * NewsScoreCard renders a prominent card showing the aggregate early warning
 * score with colour-coded severity, risk badge, and sub-score breakdown.
 */
export default function NewsScoreCard({ result }: NewsScoreCardProps) {
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
          {result.riskLevel}
        </span>
      </div>

      {/* E-zone indicator */}
      {result.hasEZone && (
        <div
          className="news-score-card__ezone-badge"
          style={{
            backgroundColor: '#9C27B0',
            color: '#ffffff',
            padding: '2px 10px',
            borderRadius: 4,
            fontWeight: 700,
            fontSize: '0.85em',
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          E-ZONE
        </div>
      )}

      {/* Sub-score breakdown */}
      <div className="news-score-card__breakdown">
        <div className="news-score-card__breakdown-title">Sub-Score Breakdown</div>
        <ul className="news-score-card__breakdown-list">
          {result.subScores.map((sub: QADDSSubScore) => {
            const level = getSubScoreLevel(sub.score);
            return (
              <li key={sub.parameter} className="news-score-card__breakdown-item">
                <span className="news-score-card__param-name">{sub.parameter}</span>
                <span className="news-score-card__param-value">
                  {String(sub.value)}
                </span>
                <span
                  className="news-score-card__param-score"
                  style={{
                    backgroundColor: `var(--news-score-${level})`,
                    color: level >= 2 ? 'var(--news-score-text-light)' : 'var(--news-score-text-dark)',
                  }}
                >
                  {sub.score}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
