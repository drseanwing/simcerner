/**
 * @file sessionStore.ts
 * @description Zustand store for session and UI state in the SimCerner EMR.
 *
 * Tracks the current view, search query, and authentication state.
 * Lightweight store that drives top-level navigation and the
 * patient search workflow.
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

/** Read-only state slice of the session store. */
export interface SessionState {
  /** Active view identifier shown in the main content area. */
  currentView: string;

  /** Current search input value for the patient search bar. */
  searchQuery: string;

  /** Whether the user has authenticated into the simulation. */
  isAuthenticated: boolean;

  /** Display name of the logged-in user. */
  userName: string;
}

/** Mutation actions exposed by the session store. */
export interface SessionActions {
  /**
   * Switch the active view.
   * @param view - View identifier (e.g. 'search', 'summary', 'vitals', 'mar').
   */
  setCurrentView: (view: string) => void;

  /**
   * Update the patient search query string.
   * @param query - The search text.
   */
  setSearchQuery: (query: string) => void;

  /**
   * Set the authentication flag.
   * @param authenticated - Whether the user is authenticated.
   */
  setAuthenticated: (authenticated: boolean) => void;

  /**
   * Set the display name of the current user.
   * @param name - User display name.
   */
  setUserName: (name: string) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/** Combined session store type. */
export type SessionStore = SessionState & SessionActions;

/**
 * Zustand store for session / UI state.
 *
 * @example
 * ```tsx
 * const view = useSessionStore(s => s.currentView);
 * const setView = useSessionStore(s => s.setCurrentView);
 * ```
 */
export const useSessionStore = create<SessionStore>((set) => ({
  // -- initial state --------------------------------------------------------
  currentView: 'search',
  searchQuery: '',
  isAuthenticated: false,
  userName: '',

  // -- actions --------------------------------------------------------------

  setCurrentView: (view) => set({ currentView: view }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),

  setUserName: (name) => set({ userName: name }),
}));
