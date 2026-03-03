/**
 * @file iview.ts
 * @description Data model types for the Interactive View (iView) clinical
 * documentation tool in the SimCerner EMR application.
 *
 * iView is Cerner's flowsheet-based documentation system that allows
 * clinicians to chart assessments across time-columned grids organised
 * into navigator bands and sections. This module defines the complete
 * type hierarchy from bands → sections → parameters → entries.
 */

// ---------------------------------------------------------------------------
// Assessment Parameters
// ---------------------------------------------------------------------------

/** Input types supported by assessment parameter fields. */
export type AssessmentInputType =
  | 'text'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'textarea';

/**
 * Definition of a single assessment parameter within a section.
 *
 * Parameters are the row-level items displayed in the flowsheet grid.
 * Each parameter defines its input type, optional pick-list values,
 * unit of measurement, and normal reference range.
 *
 * @example
 * ```ts
 * const tempParam: AssessmentParameter = {
 *   id: 'temp',
 *   label: 'Temperature',
 *   type: 'number',
 *   unit: '°C',
 *   normalRange: { min: 36.1, max: 38.0 },
 * };
 * ```
 */
export interface AssessmentParameter {
  /** Unique identifier for this parameter. */
  id: string;

  /** Human-readable display label. */
  label: string;

  /** Input control type used when documenting this parameter. */
  type: AssessmentInputType;

  /** Pick-list options for 'select' type parameters. */
  options?: string[];

  /** Unit of measurement displayed alongside the value. */
  unit?: string;

  /** Normal reference range; values outside trigger abnormal highlighting. */
  normalRange?: { min: number; max: number };
}

// ---------------------------------------------------------------------------
// Sections & Bands
// ---------------------------------------------------------------------------

/**
 * A section within a navigator band, containing assessment parameters
 * that form the rows of the flowsheet grid.
 *
 * @example
 * ```ts
 * const vitalsSection: IViewSection = {
 *   id: 'vital-signs',
 *   name: 'Vital Signs',
 *   parameters: [tempParam, hrParam, rrParam],
 * };
 * ```
 */
export interface IViewSection {
  /** Unique section identifier. */
  id: string;

  /** Display name shown in the navigator and flowsheet header. */
  name: string;

  /** Ordered list of assessment parameters in this section. */
  parameters: AssessmentParameter[];
}

/**
 * A navigator band — a collapsible group of related sections
 * in the left-hand navigator panel.
 *
 * @example
 * ```ts
 * const medSurgBand: IViewBand = {
 *   id: 'med-surg',
 *   name: 'Med Surg',
 *   icon: '🏥',
 *   sections: [vitalsSection, painSection],
 *   expanded: true,
 *   documented: true,
 * };
 * ```
 */
export interface IViewBand {
  /** Unique band identifier. */
  id: string;

  /** Display name shown in the band header. */
  name: string;

  /** Emoji or icon identifier for the band. */
  icon: string;

  /** Ordered list of sections within this band. */
  sections: IViewSection[];

  /** Whether the band is currently expanded in the navigator. */
  expanded: boolean;

  /** Whether any section in this band has documentation in the current timeframe. */
  documented: boolean;
}

// ---------------------------------------------------------------------------
// Assessment Entries
// ---------------------------------------------------------------------------

/**
 * A single assessment entry — one cell value in the flowsheet grid.
 *
 * Represents a documented value for a specific parameter at a specific
 * time, linked back to its section and band for navigation.
 */
export interface AssessmentEntry {
  /** Parameter this entry documents. */
  parameterId: string;

  /** Section the parameter belongs to. */
  sectionId: string;

  /** Band the section belongs to. */
  bandId: string;

  /** Documented value (string for text/select, number for numeric, boolean for checkbox). */
  value: string | number | boolean;

  /** ISO-8601 timestamp when the entry was documented. */
  timestamp: string;

  /** Name of the clinician who documented the entry. */
  documentedBy: string;

  /** Whether the entry has been signed/finalised. */
  signed: boolean;
}

// ---------------------------------------------------------------------------
// Toolbar Configuration
// ---------------------------------------------------------------------------

/** Time interval options for flowsheet column spacing. */
export type TimeInterval = '1hr' | '2hr' | '4hr' | '8hr' | '12hr';

/**
 * Configuration state for the iView toolbar controls.
 */
export interface IViewToolbarConfig {
  /** Selected time interval for flowsheet columns. */
  timeInterval: TimeInterval;

  /** Whether to display rows with no documented values. */
  showEmptyRows: boolean;

  /** Visible time range for the flowsheet columns. */
  timeRange: { start: Date; end: Date };
}
