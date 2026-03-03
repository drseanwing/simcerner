/**
 * @file Sidebar.tsx
 * @description Left-hand navigation sidebar listing all chart views.
 *
 * Migrated from the Sidebar section of emr-sim-v2.html. Displays grouped
 * navigation items that switch the active view in the session store.
 * Includes both original views and enhanced features (Interactive View,
 * Deterioration Dashboard).
 */

import { useSessionStore } from '../../stores/sessionStore';
import '../../styles/components/layout.css';

/** Sidebar menu item definition. */
interface SidebarMenuItem {
  /** Unique view identifier matching sessionStore.currentView values. */
  id: string;
  /** Display label shown in the sidebar. */
  label: string;
}

/** Sidebar section containing a header and a list of menu items. */
interface SidebarSection {
  /** Section header text. */
  header: string;
  /** Menu items belonging to this section. */
  items: SidebarMenuItem[];
}

/** All sidebar sections and their menu items. */
const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    header: 'Chart Views',
    items: [
      { id: 'doctor-view', label: 'Doctor View' },
      { id: 'vitals', label: 'Managing Deterioration' },
      { id: 'vitals-graph', label: 'Vitals Graph' },
      { id: 'fluid-balance', label: 'Fluid Balance' },
      { id: 'orders', label: 'Orders' },
      { id: 'results', label: 'Results' },
      { id: 'documentation', label: 'Documentation' },
      { id: 'mar', label: 'MAR' },
    ],
  },
  {
    header: 'Enhanced Features',
    items: [
      { id: 'iview', label: 'Interactive View' },
      { id: 'deterioration', label: 'Deterioration Dashboard' },
    ],
  },
  {
    header: 'Tools',
    items: [
      { id: 'handover', label: 'Handover Summary' },
    ],
  },
];

/**
 * Sidebar renders the left navigation panel with grouped menu items.
 * Clicking an item updates the current view in the session store.
 * The active item is visually highlighted.
 */
export default function Sidebar() {
  const currentView = useSessionStore((s) => s.currentView);
  const setCurrentView = useSessionStore((s) => s.setCurrentView);

  return (
    <aside className="sidebar">
      {SIDEBAR_SECTIONS.map((section) => (
        <div key={section.header} className="sidebar-section">
          <div className="sidebar-header">{section.header}</div>
          {section.items.map((item) => (
            <button
              key={item.id}
              className={`sidebar-item${currentView === item.id ? ' active' : ''}`}
              onClick={() => setCurrentView(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </aside>
  );
}
