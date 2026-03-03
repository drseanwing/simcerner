/**
 * @file METCallBanner.tsx
 * @description Prominent banner displayed when a patient meets MET call criteria
 * (EWS >= 8 or any vital sign in the E-zone).
 *
 * Renders a purple/red banner with white text showing the triggering reason(s).
 * Returns null when MET call criteria are not met.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by the METCallBanner component. */
export interface METCallBannerProps {
  /** Current aggregate EWS score. */
  ewsScore: number;
  /** Whether any vital sign parameter is in the E-zone. */
  hasEZone: boolean;
  /** Which parameters triggered E-zone (e.g. ['Respiratory Rate', 'SpO2']). */
  eZoneParameters: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * METCallBanner renders a high-visibility alert banner when MET call criteria
 * are met. It displays the triggering reason(s): high EWS score and/or E-zone
 * parameters.
 *
 * If neither criterion is met (ewsScore < 8 and no E-zone), returns null.
 */
export default function METCallBanner({
  ewsScore,
  hasEZone,
  eZoneParameters,
}: METCallBannerProps) {
  if (ewsScore < 8 && !hasEZone) return null;

  const reasons: string[] = [];
  if (ewsScore >= 8) reasons.push(`EWS Score: ${ewsScore} (>=8)`);
  if (hasEZone && eZoneParameters.length > 0) {
    reasons.push(`E-Zone: ${eZoneParameters.join(', ')}`);
  }

  return (
    <div
      role="alert"
      style={{
        backgroundColor: '#7b1fa2',
        color: '#ffffff',
        borderRadius: 6,
        padding: '12px 16px',
        marginBottom: 12,
        boxShadow: '0 2px 8px rgba(123, 31, 162, 0.4)',
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          marginBottom: reasons.length > 0 ? 4 : 0,
          letterSpacing: 0.3,
        }}
      >
        {'\u26A0'} MET Call Criteria Met
      </div>
      {reasons.length > 0 && (
        <div style={{ fontSize: 12, opacity: 0.95 }}>
          {reasons.join('  |  ')}
        </div>
      )}
    </div>
  );
}
