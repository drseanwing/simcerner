/**
 * @file EscalationProtocol.tsx
 * @description Displays clinical response recommendations based on Q-ADDS score.
 *
 * Shows a set of escalation cards coloured by severity, each describing the
 * recommended monitoring frequency and escalation actions (Q-ADDS 5-tier):
 * - Normal (0):     Routine 8-hourly observations
 * - Low (1–3):      Increased observation, 4-hourly / 1-hourly
 * - Moderate (4–5): RMO review within 30 minutes
 * - High (6–7):     Registrar review within 30 minutes
 * - MET (>=8 or E): MET call — emergency response
 */

import type { ClinicalRisk } from '../../types';
import '../../styles/components/views.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by the EscalationProtocol component. */
export interface EscalationProtocolProps {
  /** The aggregate Q-ADDS score. */
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
    risk: 'Normal',
    scoreRange: '0',
    icon: '✓',
    colour: '#2e7d32',
    bgColour: '#e8f5e9',
    title: 'Routine Monitoring',
    frequency: '8-hourly observations (minimum)',
    actions: ['Continue routine Q-ADDS monitoring', 'Document observations as per protocol'],
  },
  {
    risk: 'Low',
    scoreRange: '1–3',
    icon: '⬆',
    colour: '#f9a825',
    bgColour: '#fffde7',
    title: 'Increased Observation',
    frequency: '4-hourly (stable) / 1-hourly (deteriorating)',
    actions: [
      'Notify Team Leader',
      'Nurse escort required for transfers',
      'If deteriorating: increase to 1-hourly observations',
    ],
  },
  {
    risk: 'Moderate',
    scoreRange: '4–5',
    icon: '⚠',
    colour: '#e65100',
    bgColour: '#fff3e0',
    title: 'RMO Review Required',
    frequency: '2-hourly (stable) / 1-hourly (deteriorating)',
    actions: [
      'Notify Team Leader',
      'Notify RMO to review within 30 minutes',
      'Nurse escort required',
      'If no RMO review → escalate to Registrar',
    ],
  },
  {
    risk: 'High',
    scoreRange: '6–7',
    icon: '🔶',
    colour: '#bf360c',
    bgColour: '#fbe9e7',
    title: 'Registrar Review Required',
    frequency: '1-hourly (stable) / ½-hourly (deteriorating)',
    actions: [
      'Notify Team Leader',
      'Notify Registrar to review within 30 minutes',
      'Nurse escort required',
      'If no Registrar review → initiate MET call or escalate to SMO',
    ],
  },
  {
    risk: 'MET',
    scoreRange: '≥ 8 or E-zone',
    icon: '🚨',
    colour: '#7b1fa2',
    bgColour: '#f3e5f5',
    title: 'MET Call — Emergency Response',
    frequency: '10-minutely observations (½-hourly if stable with MET-MEO)',
    actions: [
      'Initiate MET Call immediately',
      'Registrar to ensure SMO/Consultant notified',
      'Registrar and Nurse escort required',
      'If MET-MEO plan active and stable: ½-hourly observations minimum',
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * EscalationProtocol renders colour-coded escalation cards showing the
 * recommended clinical response for each Q-ADDS risk tier. The card
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
