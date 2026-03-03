/**
 * @file METMEOPanel.tsx
 * @description Collapsible panel showing active MET-MEO orders for a patient.
 *
 * When no active plan exists, shows a "Create MET-MEO Plan" action link.
 * When an active plan exists, displays order details including trigger type,
 * rationale, duration, expiry countdown, authorising clinician, and status.
 *
 * All state is local (simulation — no backend persistence).
 */

import { useState, useMemo, useCallback } from 'react';
import type { METMEOOrder } from '../../types';
import METMEOOrderDialog from './METMEOOrderDialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Props accepted by the METMEOPanel component. */
export interface METMEOPanelProps {
  /** Patient MRN. */
  patientId: string;
  /** Current aggregate EWS score. */
  ewsScore: number;
  /** Whether any vital sign is in the E-zone. */
  hasEZone: boolean;
  /** Which parameters triggered E-zone. */
  eZoneParameters: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTriggerType(t: METMEOOrder['triggerType']): string {
  switch (t) {
    case 'EWS_GTE_8':
      return 'EWS \u2265 8';
    case 'E_ZONE':
      return 'E-Zone Parameter';
    case 'BOTH':
      return 'EWS \u2265 8 + E-Zone';
    default:
      return String(t);
  }
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatCountdown(expiresIso: string): string {
  const diff = new Date(expiresIso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const SECTION_STYLE: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ccc',
  marginBottom: 15,
};

const SECTION_HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 12px',
  background: '#f5f5f5',
  borderBottom: '1px solid #ccc',
  cursor: 'pointer',
  userSelect: 'none',
};

const DETAIL_ROW: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '4px 0',
  fontSize: 11,
  borderBottom: '1px solid #f0f0f0',
};

const DETAIL_LABEL: React.CSSProperties = {
  fontWeight: 600,
  color: '#555',
};

const STATUS_BADGE: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 8px',
  borderRadius: 10,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 0.3,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function METMEOPanel({
  patientId,
  ewsScore,
  hasEZone,
  eZoneParameters,
}: METMEOPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activePlan, setActivePlan] = useState<METMEOOrder | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  /** Check expiry on each render. */
  const effectiveStatus = useMemo(() => {
    if (!activePlan) return null;
    if (activePlan.status === 'CANCELLED') return 'CANCELLED';
    if (new Date(activePlan.expiresAt).getTime() <= Date.now()) return 'EXPIRED';
    return 'ACTIVE';
  }, [activePlan]);

  const handleSubmit = useCallback((order: METMEOOrder) => {
    setActivePlan(order);
    setShowDialog(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (!activePlan) return;
    setActivePlan({
      ...activePlan,
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
    });
  }, [activePlan]);

  return (
    <>
      <div style={SECTION_STYLE}>
        {/* Section header with collapse toggle */}
        <div
          style={SECTION_HEADER_STYLE}
          onClick={() => setCollapsed((c) => !c)}
        >
          <span style={{ fontWeight: 600, fontSize: 12 }}>
            {collapsed ? '\u25B6' : '\u25BC'} MET-MEO Plan
          </span>
          {effectiveStatus === 'ACTIVE' && (
            <span
              style={{
                ...STATUS_BADGE,
                background: '#e8f5e9',
                color: '#2e7d32',
              }}
            >
              ACTIVE
            </span>
          )}
        </div>

        {/* Panel body */}
        {!collapsed && (
          <div style={{ padding: 12 }}>
            {!activePlan || effectiveStatus !== 'ACTIVE' ? (
              /* No active plan */
              <div>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 8 }}>
                  No active MET-MEO plan
                </div>
                <button
                  onClick={() => setShowDialog(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0066b2',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Create MET-MEO Plan
                </button>
              </div>
            ) : (
              /* Active plan details */
              <div>
                <div style={DETAIL_ROW}>
                  <span style={DETAIL_LABEL}>Order ID</span>
                  <span style={{ fontSize: 10, fontFamily: 'monospace' }}>
                    {activePlan.orderId.slice(0, 8)}...
                  </span>
                </div>
                <div style={DETAIL_ROW}>
                  <span style={DETAIL_LABEL}>Trigger</span>
                  <span>{formatTriggerType(activePlan.triggerType)}</span>
                </div>
                {activePlan.eZoneVitalSign && (
                  <div style={DETAIL_ROW}>
                    <span style={DETAIL_LABEL}>E-Zone Vital Sign</span>
                    <span>
                      {activePlan.eZoneVitalSign}
                      {activePlan.eZoneLowerBound != null &&
                        activePlan.eZoneUpperBound != null && (
                          <span style={{ color: '#999', marginLeft: 4 }}>
                            ({activePlan.eZoneLowerBound}&ndash;{activePlan.eZoneUpperBound})
                          </span>
                        )}
                    </span>
                  </div>
                )}
                <div style={DETAIL_ROW}>
                  <span style={DETAIL_LABEL}>Rationale</span>
                  <span
                    style={{
                      maxWidth: 300,
                      textAlign: 'right',
                      wordBreak: 'break-word',
                    }}
                  >
                    {activePlan.rationale}
                  </span>
                </div>
                <div style={DETAIL_ROW}>
                  <span style={DETAIL_LABEL}>Duration</span>
                  <span>{activePlan.durationHours}h</span>
                </div>
                <div style={DETAIL_ROW}>
                  <span style={DETAIL_LABEL}>Signed</span>
                  <span>{formatDateTime(activePlan.signedAt)}</span>
                </div>
                <div style={DETAIL_ROW}>
                  <span style={DETAIL_LABEL}>Expires</span>
                  <span>
                    {formatDateTime(activePlan.expiresAt)}{' '}
                    <span style={{ color: '#7b1fa2', fontWeight: 600 }}>
                      ({formatCountdown(activePlan.expiresAt)})
                    </span>
                  </span>
                </div>
                <div style={DETAIL_ROW}>
                  <span style={DETAIL_LABEL}>Authorised By</span>
                  <span>
                    {activePlan.authorisingClinicianId} (
                    {activePlan.authorisingClinicianRole === 'SMO'
                      ? 'SMO'
                      : 'Registrar'}
                    )
                  </span>
                </div>
                <div style={{ ...DETAIL_ROW, borderBottom: 'none' }}>
                  <span style={DETAIL_LABEL}>Status</span>
                  <span
                    style={{
                      ...STATUS_BADGE,
                      background: '#e8f5e9',
                      color: '#2e7d32',
                    }}
                  >
                    ACTIVE
                  </span>
                </div>

                {/* Cancel button */}
                <div style={{ marginTop: 10, textAlign: 'right' }}>
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: '4px 12px',
                      background: '#fff',
                      color: '#d9534f',
                      border: '1px solid #d9534f',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    Cancel Order
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order dialog */}
      <METMEOOrderDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onSubmit={handleSubmit}
        ewsScore={ewsScore}
        hasEZone={hasEZone}
        eZoneParameters={eZoneParameters}
        patientId={patientId}
      />
    </>
  );
}
