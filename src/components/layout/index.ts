/**
 * @file index.ts
 * @description Barrel export for all layout components.
 *
 * Allows consumers to import layout components from a single entry point:
 * ```ts
 * import { TopNav, PatientBanner, Sidebar, StatusBar } from './components/layout';
 * ```
 */

export { default as TopNav } from './TopNav';
export { default as PatientBanner } from './PatientBanner';
export { default as Sidebar } from './Sidebar';
export { default as StatusBar } from './StatusBar';
