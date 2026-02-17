/**
 * @file usePatient.ts
 * @description React hook wrapping the patient Zustand store.
 *
 * Provides a convenient API for components that need to load, search,
 * and display patient data without directly importing the store.
 */

import { useCallback, useMemo } from 'react';
import { usePatientStore } from '../stores/patientStore';
import { loadPatients as loadPatientsFromService } from '../services/patientLoader';

// ---------------------------------------------------------------------------
// Hook Return Type
// ---------------------------------------------------------------------------

/** Shape returned by the {@link usePatient} hook. */
export interface UsePatientResult {
  /** The currently selected patient, or null. */
  currentPatient: ReturnType<typeof usePatientStore>['currentPatient'];

  /** Whether a patient data load is in progress. */
  loading: boolean;

  /** Error message from the last failed operation, or null. */
  error: string | null;

  /** Full patient roster keyed by MRN. */
  patients: ReturnType<typeof usePatientStore>['patients'];

  /**
   * Load a specific patient by MRN from the in-memory roster.
   * If the roster is empty, triggers a full load first.
   *
   * @param mrn - Medical record number to look up.
   */
  loadPatient: (mrn: string) => Promise<void>;

  /**
   * Filter the loaded patient roster by a free-text query.
   * Matches against MRN, name, and location (case-insensitive).
   *
   * @param query - Search text.
   * @returns Array of patients matching the query.
   */
  searchPatients: (query: string) => ReturnType<typeof usePatientStore>['currentPatient'][];
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook for patient data access.
 *
 * Wraps {@link usePatientStore} with higher-level `loadPatient` and
 * `searchPatients` helpers.
 *
 * @example
 * ```tsx
 * const { currentPatient, loading, loadPatient, searchPatients } = usePatient();
 *
 * useEffect(() => { loadPatient('PAH599806'); }, [loadPatient]);
 *
 * const results = searchPatients('campbell');
 * ```
 */
export function usePatient(): UsePatientResult {
  const patients = usePatientStore((s) => s.patients);
  const currentPatient = usePatientStore((s) => s.currentPatient);
  const loading = usePatientStore((s) => s.loading);
  const error = usePatientStore((s) => s.error);
  const setPatients = usePatientStore((s) => s.setPatients);
  const setCurrentPatient = usePatientStore((s) => s.setCurrentPatient);
  const setLoading = usePatientStore((s) => s.setLoading);
  const setError = usePatientStore((s) => s.setError);

  /**
   * Load a patient by MRN. Triggers a full data load if the roster
   * is empty, then selects the requested patient.
   */
  const loadPatient = useCallback(
    async (mrn: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        let roster = patients;

        // If the roster is empty, load from the service
        if (Object.keys(roster).length === 0) {
          roster = await loadPatientsFromService();
          setPatients(roster);
        }

        const patient = roster[mrn];
        if (patient) {
          setCurrentPatient(patient);
        } else {
          setError(`Patient with MRN "${mrn}" not found`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [patients, setPatients, setCurrentPatient, setLoading, setError],
  );

  /**
   * Search the loaded roster by name, MRN, or location.
   * Returns all patients if query is empty.
   */
  const searchPatients = useCallback(
    (query: string) => {
      const list = Object.values(patients);
      if (!query.trim()) return list;

      const q = query.toLowerCase();
      return list.filter(
        (p) =>
          p.mrn.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q),
      );
    },
    [patients],
  );

  return useMemo(
    () => ({
      currentPatient,
      loading,
      error,
      patients,
      loadPatient,
      searchPatients,
    }),
    [currentPatient, loading, error, patients, loadPatient, searchPatients],
  );
}
