/**
 * @file NavigatorPanel.tsx
 * @description Left-hand navigator panel for the iView component.
 *
 * Renders a vertically-stacked list of collapsible bands, each containing
 * clickable section items. Mirrors the Cerner iView navigator where
 * clinicians select which assessment section to chart in the flowsheet.
 *
 * Features:
 * - Expand/collapse band groups with chevron animation
 * - Active section highlight with left-accent border
 * - Green checkmark (✓) next to sections with existing documentation
 * - Green dot indicator on band headers when any child section is documented
 */

import type { IViewBand, AssessmentEntry } from '../../types/iview';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props accepted by the NavigatorPanel component. */
export interface NavigatorPanelProps {
  /** Ordered list of navigator bands to display. */
  bands: IViewBand[];

  /** Currently selected section ID, or null if none. */
  activeSectionId: string | null;

  /** All assessment entries for checking documented status. */
  entries: AssessmentEntry[];

  /** Callback fired when a section is clicked. */
  onSectionSelect: (sectionId: string, bandId: string) => void;

  /** Callback fired when a band header is clicked to toggle expand/collapse. */
  onBandToggle: (bandId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * NavigatorPanel renders the iView left-sidebar navigator with collapsible
 * bands and selectable sections.
 */
export default function NavigatorPanel({
  bands,
  activeSectionId,
  entries,
  onSectionSelect,
  onBandToggle,
}: NavigatorPanelProps) {
  /**
   * Check whether a given section has any documented entries.
   * @param sectionId - The section to check.
   */
  function isSectionDocumented(sectionId: string): boolean {
    return entries.some((e) => e.sectionId === sectionId);
  }

  /**
   * Check whether any section within a band has documentation.
   * @param band - The band to check.
   */
  function isBandDocumented(band: IViewBand): boolean {
    return band.sections.some((s) => isSectionDocumented(s.id));
  }

  return (
    <nav className="navigator-panel" role="navigation" aria-label="iView Navigator">
      <div className="navigator-panel__header">Navigator</div>
      <div className="navigator-panel__bands">
        {bands.map((band) => (
          <div key={band.id} className="navigator-band">
            {/* Band header — toggle expand/collapse */}
            <button
              className="navigator-band-header"
              onClick={() => onBandToggle(band.id)}
              aria-expanded={band.expanded}
              aria-controls={`band-sections-${band.id}`}
            >
              <span
                className={`navigator-band-header__chevron${
                  band.expanded ? ' navigator-band-header__chevron--expanded' : ''
                }`}
                aria-hidden="true"
              >
                ▶
              </span>
              <span className="navigator-band-header__icon" aria-hidden="true">
                {band.icon}
              </span>
              <span className="navigator-band-header__name">{band.name}</span>
              {isBandDocumented(band) && (
                <span
                  className="navigator-band-header__documented"
                  title="Has documentation"
                  aria-label="Band has documented entries"
                />
              )}
            </button>

            {/* Expanded sections list */}
            {band.expanded && (
              <div
                id={`band-sections-${band.id}`}
                className="navigator-band__sections"
                role="list"
              >
                {band.sections.map((section) => {
                  const isActive = activeSectionId === section.id;
                  const documented = isSectionDocumented(section.id);

                  return (
                    <button
                      key={section.id}
                      className={`navigator-section${isActive ? ' active' : ''}`}
                      onClick={() => onSectionSelect(section.id, band.id)}
                      role="listitem"
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="navigator-section__name">{section.name}</span>
                      {documented && (
                        <span
                          className="navigator-checkmark"
                          title="Documented"
                          aria-label="Section has entries"
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
