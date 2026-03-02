import { create } from 'zustand'
import type { Patient, Order } from '@/types/patient'

interface PatientState {
  patients: Record<string, Patient>
  currentPatient: Patient | null
  loading: boolean
  loadError: string | null

  setPatients: (patients: Record<string, Patient>) => void
  setCurrentPatient: (patient: Patient | null) => void
  setLoading: (loading: boolean) => void
  setLoadError: (error: string | null) => void
  addOrder: (order: Order) => void
  signOrder: (orderId: string) => void
}

export const usePatientStore = create<PatientState>()((set) => ({
  patients: {},
  currentPatient: null,
  loading: false,
  loadError: null,

  setPatients: (patients) => set({ patients }),

  setCurrentPatient: (patient) => set({ currentPatient: patient }),

  setLoading: (loading) => set({ loading }),

  setLoadError: (error) => set({ loadError: error }),

  addOrder: (order) =>
    set((state) => {
      if (!state.currentPatient) return state
      return {
        currentPatient: {
          ...state.currentPatient,
          orders: [...state.currentPatient.orders, order],
        },
      }
    }),

  signOrder: (orderId) =>
    set((state) => {
      if (!state.currentPatient) return state
      return {
        currentPatient: {
          ...state.currentPatient,
          orders: state.currentPatient.orders.map((o) =>
            o.id === orderId ? { ...o, signed: true, status: 'Active' as const } : o,
          ),
        },
      }
    }),
}))
