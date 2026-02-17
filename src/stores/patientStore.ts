/**
 * @file patientStore.ts
 * @description Zustand store for patient data management in the SimCerner EMR.
 *
 * Provides centralised state for the patient roster, currently-selected
 * patient, loading/error flags, and mutation actions for orders and
 * patient updates. All components that need patient data should consume
 * this store via the {@link usePatientStore} hook.
 */

import { create } from 'zustand';
import type { Patient, Order, OrderStatus } from '../types';

// ---------------------------------------------------------------------------
// State Shape
// ---------------------------------------------------------------------------

/** Read-only state slice of the patient store. */
export interface PatientState {
  /** Map of MRN → Patient for all loaded patients. */
  patients: Record<string, Patient>;

  /** The patient currently selected in the UI, or null if none. */
  currentPatient: Patient | null;

  /** Whether a patient data load operation is in progress. */
  loading: boolean;

  /** Human-readable error message from the most recent failed operation. */
  error: string | null;
}

/** Mutation actions exposed by the patient store. */
export interface PatientActions {
  /**
   * Replace the entire patient roster.
   * @param patients - Map of MRN → Patient.
   */
  setPatients: (patients: Record<string, Patient>) => void;

  /**
   * Select a patient as the current context.
   * @param patient - The patient to focus on.
   */
  setCurrentPatient: (patient: Patient) => void;

  /** Deselect the current patient. */
  clearCurrentPatient: () => void;

  /**
   * Append a new order to a patient's order list.
   * Also updates the patient in the roster map.
   * @param mrn   - Target patient MRN.
   * @param order - The order to add.
   */
  addOrder: (mrn: string, order: Order) => void;

  /**
   * Mark an order as "Signed" by setting its signed timestamp and status.
   * @param mrn     - Target patient MRN.
   * @param orderId - The order ID to sign.
   */
  signOrder: (mrn: string, orderId: string) => void;

  /**
   * Merge partial patient data into an existing patient record.
   * @param mrn     - Target patient MRN.
   * @param updates - Partial patient fields to merge.
   */
  updatePatient: (mrn: string, updates: Partial<Patient>) => void;

  /**
   * Set the loading flag.
   * @param loading - Whether a load is in progress.
   */
  setLoading: (loading: boolean) => void;

  /**
   * Set an error message (or clear it with null).
   * @param error - Error message or null to clear.
   */
  setError: (error: string | null) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/** Combined patient store type. */
export type PatientStore = PatientState & PatientActions;

/**
 * Zustand store for patient data.
 *
 * @example
 * ```tsx
 * const patients = usePatientStore(s => s.patients);
 * const setCurrent = usePatientStore(s => s.setCurrentPatient);
 * ```
 */
export const usePatientStore = create<PatientStore>((set, get) => ({
  // -- initial state --------------------------------------------------------
  patients: {},
  currentPatient: null,
  loading: false,
  error: null,

  // -- actions --------------------------------------------------------------

  setPatients: (patients) => set({ patients, error: null }),

  setCurrentPatient: (patient) => set({ currentPatient: patient }),

  clearCurrentPatient: () => set({ currentPatient: null }),

  addOrder: (mrn, order) => {
    const { patients, currentPatient } = get();
    const target = patients[mrn];
    if (!target) return;

    const updatedOrders = [...target.orders, order];
    const updatedPatient: Patient = { ...target, orders: updatedOrders };

    set({
      patients: { ...patients, [mrn]: updatedPatient },
      currentPatient:
        currentPatient?.mrn === mrn ? updatedPatient : currentPatient,
    });
  },

  signOrder: (mrn, orderId) => {
    const { patients, currentPatient } = get();
    const target = patients[mrn];
    if (!target) return;

    const signedStatus: OrderStatus = 'Signed';
    const updatedOrders = target.orders.map((o) =>
      o.id === orderId
        ? { ...o, status: signedStatus, signed: new Date().toISOString() }
        : o,
    );
    const updatedPatient: Patient = { ...target, orders: updatedOrders };

    set({
      patients: { ...patients, [mrn]: updatedPatient },
      currentPatient:
        currentPatient?.mrn === mrn ? updatedPatient : currentPatient,
    });
  },

  updatePatient: (mrn, updates) => {
    const { patients, currentPatient } = get();
    const target = patients[mrn];
    if (!target) return;

    const updatedPatient: Patient = { ...target, ...updates };

    set({
      patients: { ...patients, [mrn]: updatedPatient },
      currentPatient:
        currentPatient?.mrn === mrn ? updatedPatient : currentPatient,
    });
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));
