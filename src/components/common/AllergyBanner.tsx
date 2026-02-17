/**
 * @file AllergyBanner.tsx
 * @description Enhanced allergy alert banner displayed in the patient banner area.
 *
 * Shows a prominent colour-coded strip:
 * - Red background with allergy badges when allergies are present
 * - Green "NKDA" strip when no known drug allergies
 *
 * Expandable to show detailed allergy information including severity,
 * type, and reaction data.
 */

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Detailed allergy information for the expanded view. */
export interface AllergyDetail {
  /** Allergen name (e.g. "Penicillin"). */
  name: string;
  /** Severity level. */
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Unknown';
  /** Type of allergy. */
  type: 'Drug' | 'Food' | 'Environmental' | 'Other';
  /** Reaction description. */
  reaction: string;
}

/** Props accepted by AllergyBanner. */
interface AllergyBannerProps {
  /** List of allergy names from the patient record. */
  allergies: string[];
  /** Optional detailed allergy info for the expanded view. */
  allergyDetails?: AllergyDetail[];
  /** Optional active drug-allergy interaction alerts. */
  activeAlerts?: string[];
}

// ---------------------------------------------------------------------------
// Default allergy details for known patients
// ---------------------------------------------------------------------------

const DEFAULT_ALLERGY_DETAILS: Record<string, AllergyDetail> = {
  Penicillin: {
    name: 'Penicillin',
    severity: 'Severe',
    type: 'Drug',
    reaction: 'Anaphylaxis – urticaria, angioedema, bronchospasm',
  },
  Latex: {
    name: 'Latex',
    severity: 'Moderate',
    type: 'Environmental',
    reaction: 'Contact dermatitis, urticaria',
  },
  Aspirin: {
    name: 'Aspirin',
    severity: 'Moderate',
    type: 'Drug',
    reaction: 'Bronchospasm, rhinitis',
  },
  Codeine: {
    name: 'Codeine',
    severity: 'Mild',
    type: 'Drug',
    reaction: 'Nausea, pruritus',
  },
  Sulfonamides: {
    name: 'Sulfonamides',
    severity: 'Severe',
    type: 'Drug',
    reaction: 'Stevens-Johnson syndrome',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AllergyBanner renders a colour-coded allergy strip with expandable details.
 *
 * - Red banner with allergy badges when allergies are present
 * - Green "NKDA" badge when allergy list is empty
 * - Click to expand shows severity, type, and reaction for each allergen
 * - Active drug-allergy interaction warnings displayed as alert badges
 */
export default function AllergyBanner({
  allergies,
  allergyDetails,
  activeAlerts,
}: AllergyBannerProps) {
  const [expanded, setExpanded] = useState(false);

  const hasAllergies = allergies.length > 0;

  const toggleExpand = useCallback(() => {
    if (hasAllergies) {
      setExpanded((prev) => !prev);
    }
  }, [hasAllergies]);

  /** Resolve detail for an allergen from explicit props or defaults. */
  const getDetail = (allergyName: string): AllergyDetail | undefined => {
    if (allergyDetails) {
      return allergyDetails.find((d) => d.name === allergyName);
    }
    return DEFAULT_ALLERGY_DETAILS[allergyName];
  };

  if (!hasAllergies) {
    return (
      <div className="allergy-banner allergy-banner--nkda">
        <span className="allergy-banner__badge allergy-banner__badge--nkda">
          NKDA
        </span>
        <span className="allergy-banner__label">No Known Drug Allergies</span>
      </div>
    );
  }

  return (
    <div className="allergy-banner allergy-banner--danger">
      <div className="allergy-banner__header" onClick={toggleExpand}>
        <span className="allergy-banner__icon">⚠</span>
        <span className="allergy-banner__label allergy-banner__label--danger">
          ALLERGIES:
        </span>
        <div className="allergy-banner__tags">
          {allergies.map((allergy) => {
            const detail = getDetail(allergy);
            const severityClass = detail
              ? `allergy-banner__tag--${detail.severity.toLowerCase()}`
              : '';
            return (
              <span
                key={allergy}
                className={`allergy-banner__tag ${severityClass}`}
              >
                {allergy}
              </span>
            );
          })}
        </div>
        {activeAlerts && activeAlerts.length > 0 && (
          <div className="allergy-banner__alerts">
            {activeAlerts.map((alert) => (
              <span key={alert} className="allergy-banner__alert-badge">
                ⚠ {alert}
              </span>
            ))}
          </div>
        )}
        <span className="allergy-banner__expand-icon">
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div className="allergy-banner__details">
          <table className="allergy-banner__table">
            <thead>
              <tr>
                <th>Allergen</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Reaction</th>
              </tr>
            </thead>
            <tbody>
              {allergies.map((allergy) => {
                const detail = getDetail(allergy);
                return (
                  <tr key={allergy}>
                    <td style={{ fontWeight: 600 }}>{allergy}</td>
                    <td>{detail?.type ?? 'Unknown'}</td>
                    <td>
                      <span
                        className={`allergy-banner__severity allergy-banner__severity--${(detail?.severity ?? 'unknown').toLowerCase()}`}
                      >
                        {detail?.severity ?? 'Unknown'}
                      </span>
                    </td>
                    <td>{detail?.reaction ?? 'Not documented'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
