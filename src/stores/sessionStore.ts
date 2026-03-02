import { create } from 'zustand'

interface NewOrder {
  type: string
  name: string
  priority: string
}

const DEFAULT_NEW_ORDER: NewOrder = {
  type: 'Laboratory',
  name: '',
  priority: 'Routine',
}

interface SessionState {
  searchQuery: string
  orderSearchQuery: string
  newOrder: NewOrder

  setSearchQuery: (query: string) => void
  setOrderSearchQuery: (query: string) => void
  setNewOrder: (order: NewOrder) => void
  resetNewOrder: () => void
}

export const useSessionStore = create<SessionState>()((set) => ({
  searchQuery: '',
  orderSearchQuery: '',
  newOrder: { ...DEFAULT_NEW_ORDER },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setOrderSearchQuery: (query) => set({ orderSearchQuery: query }),

  setNewOrder: (order) => set({ newOrder: order }),

  resetNewOrder: () => set({ newOrder: { ...DEFAULT_NEW_ORDER }, orderSearchQuery: '' }),
}))
