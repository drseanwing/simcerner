/**
 * Zustand store for managing MET-MEO (Modified Escalation and Observation) state.
 *
 * Holds MET-MEO Plan orders, Modified Observation Frequency orders,
 * nursing assessments, sedation assessments, and dialog visibility flags.
 * Provides actions for creating, cancelling, and querying orders.
 */

import { create } from 'zustand'
import type {
  MetMeoOrder,
  ModifiedObsFrequencyOrder,
  NursingAssessment,
  SedationAssessment,
} from '@/types/meo'

interface MeoState {
  /** All MET-MEO Plan orders (active, expired, and cancelled) */
  metMeoOrders: MetMeoOrder[]
  /** All Modified Observation Frequency orders (active and cancelled) */
  mofOrders: ModifiedObsFrequencyOrder[]

  /** Nursing assessments recorded under active MET-MEO plans */
  nursingAssessments: NursingAssessment[]
  /** Sedation assessments */
  sedationAssessments: SedationAssessment[]

  /** Dialog visibility flags */
  showMeoDialog: boolean
  showMetMeoForm: boolean
  showMofForm: boolean

  /** Order actions */
  addMetMeoOrder: (order: MetMeoOrder) => void
  cancelMetMeoOrder: (orderId: string) => void
  addMofOrder: (order: ModifiedObsFrequencyOrder) => void
  cancelMofOrder: (orderId: string) => void

  /** Assessment actions */
  addNursingAssessment: (assessment: NursingAssessment) => void
  addSedationAssessment: (assessment: SedationAssessment) => void

  /** Dialog actions */
  openMeoDialog: () => void
  closeMeoDialog: () => void
  openMetMeoForm: () => void
  closeMetMeoForm: () => void
  openMofForm: () => void
  closeMofForm: () => void

  /** Returns the first active, non-expired MET-MEO Plan order, or null */
  getActiveMetMeo: () => MetMeoOrder | null
  /** Returns the first active MOF order, or null */
  getActiveMof: () => ModifiedObsFrequencyOrder | null
}

export const useMeoStore = create<MeoState>()((set, get) => ({
  metMeoOrders: [],
  mofOrders: [],
  nursingAssessments: [],
  sedationAssessments: [],
  showMeoDialog: false,
  showMetMeoForm: false,
  showMofForm: false,

  // ---------------------------------------------------------------------------
  // Order actions
  // ---------------------------------------------------------------------------

  addMetMeoOrder: (order) =>
    set((state) => ({
      metMeoOrders: [...state.metMeoOrders, order],
    })),

  cancelMetMeoOrder: (orderId) =>
    set((state) => ({
      metMeoOrders: state.metMeoOrders.map((o) =>
        o.orderId === orderId
          ? { ...o, status: 'CANCELLED' as const, cancelledAt: new Date().toISOString() }
          : o,
      ),
    })),

  addMofOrder: (order) =>
    set((state) => ({
      mofOrders: [...state.mofOrders, order],
    })),

  cancelMofOrder: (orderId) =>
    set((state) => ({
      mofOrders: state.mofOrders.map((o) =>
        o.orderId === orderId
          ? { ...o, status: 'CANCELLED' as const, cancelledAt: new Date().toISOString() }
          : o,
      ),
    })),

  // ---------------------------------------------------------------------------
  // Assessment actions
  // ---------------------------------------------------------------------------

  addNursingAssessment: (assessment) =>
    set((state) => ({
      nursingAssessments: [...state.nursingAssessments, assessment],
    })),

  addSedationAssessment: (assessment) =>
    set((state) => ({
      sedationAssessments: [...state.sedationAssessments, assessment],
    })),

  // ---------------------------------------------------------------------------
  // Dialog actions
  // ---------------------------------------------------------------------------

  openMeoDialog: () => set({ showMeoDialog: true }),
  closeMeoDialog: () => set({ showMeoDialog: false }),
  openMetMeoForm: () => set({ showMetMeoForm: true }),
  closeMetMeoForm: () => set({ showMetMeoForm: false }),
  openMofForm: () => set({ showMofForm: true }),
  closeMofForm: () => set({ showMofForm: false }),

  // ---------------------------------------------------------------------------
  // Computed helpers
  // ---------------------------------------------------------------------------

  getActiveMetMeo: () => {
    const now = new Date().toISOString()
    return (
      get().metMeoOrders.find(
        (o) => o.status === 'ACTIVE' && o.expiresAt > now,
      ) ?? null
    )
  },

  getActiveMof: () => {
    return get().mofOrders.find((o) => o.status === 'ACTIVE') ?? null
  },
}))
