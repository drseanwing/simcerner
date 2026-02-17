/**
 * @file EscalationProtocol.tsx
 * @description Displays clinical response recommendations based on NEWS2 score.
 *
 * Shows a set of escalation cards coloured by severity, each describing the
 * recommended monitoring frequency and escalation actions:
 * - Low (0):       Routine monitoring every 12 hours
 * - Low-Medium (1-4): Minimum every 4-6 hours, inform RN in charge
 * - Medium (5-6):  Minimum hourly, urgent clinical review, consider critical care
 * - High (≥7):     Continuous monitoring, emergency review, consider ICU transfer
 */

import type { ClinicalRisk } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by the EscalationProtocol component. */
export interface EscalationProtocolProps {
  /** The aggregate NEWS2 score. */
  score: number;
  /** The derived clinical risk level. */
  clinicalRisk: ClinicalRisk;
}

// ---------------------------------------------------------------------------
// Escalation data
// ---------------------------------------------------------------------------

interface EscalationCard {
  risk: ClinicalRisk;
  scoreRange: string;
  icon: string;
  colour: string;
  bgColour: string;
  title: string;
  frequency: string;
  actions: string[];
}

const ESCALATION_CARDS: EscalationCard[] = [
  {
    risk: 'Low',
    scoreRange: '0',
    icon: '✓',
    colour: '#2e7d32',
    bgColour: '#e8f5e9',
    title: 'Routine Monitoring',
    frequency: 'Minimum every 12 hours',
    actions: [
      'Continue routine NEWS monitoring',
      'Document observations as per protocol',
    ],
  },
  {
    risk: 'Low-Medium',
    scoreRange: '1–4',
    icon: '⬆',
    colour: '#f57f17',
    bgColour: '#fff8e1',
    title: 'Increased Observation',
    frequency: 'Minimum every 4–6 hours',
    actions: [
      'Inform registered nurse in charge',
      'RN to assess and decide on escalation',
      'Increase monitoring frequency',
    ],
  },
  {
    risk: 'Medium',
    scoreRange: '5–6 (or 3 in single parameter)',
    icon: '⚠',
    colour: '#e65100',
    bgColour: '#fff3e0',
    title: 'Urgent Clinical Review',
    frequency: 'Minimum every 1 hour',
    actions: [
      'Urgent assessment by ward-based doctor or acute team nurse',
      'Consider escalation to critical care outreach',
      'Prepare ISBAR handover if escalating',
    ],
  },
  {
    risk: 'High',
    scoreRange: '≥ 7',
    icon: '🚨',
    colour: '#b71c1c',
    bgColour: '#fef2f2',
    title: 'Emergency Response',
    frequency: 'Continuous monitoring / every 30 minutes',
    actions: [
      'Immediate assessment by clinical team with critical-care competency',
      'Consider transfer to ICU / HDU',
      'Activate Medical Emergency Team (MET) call if criteria met',
      'Clinical review every 30 minutes until stabilised',
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * EscalationProtocol renders colour-coded escalation cards showing the
 * recommended clinical response for each NEWS2 risk tier. The card
 * matching the current patient risk is visually highlighted.
 */
export default function EscalationProtocol({
  clinicalRisk,
}: EscalationProtocolProps) {
  return (
    <div className="escalation-protocol">
      <div className="escalation-protocol__title">Escalation Protocol</div>
      <div className="escalation-protocol__cards">
        {ESCALATION_CARDS.map((card) => {
          const isActive = card.risk === clinicalRisk;
          return (
            <div
              key={card.risk}
              className={`escalation-card${isActive ? ' escalation-card--active' : ''}`}
              style={{
                borderLeftColor: card.colour,
                backgroundColor: isActive ? card.bgColour : undefined,
              }}
            >
              <div className="escalation-card__header">
                <span className="escalation-card__icon">{card.icon}</span>
                <span className="escalation-card__risk-title">{card.title}</span>
                <span
                  className="escalation-card__score-range"
                  style={{ color: card.colour }}
                >
                  Score: {card.scoreRange}
                </span>
              </div>
              <div className="escalation-card__frequency">
                {card.frequency}
              </div>
              <ul className="escalation-card__actions">
                {card.actions.map((action, i) => (
                  <li key={i}>{action}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
