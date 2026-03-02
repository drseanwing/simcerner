import { create } from 'zustand'

interface ClockState {
  simulationTime: Date
  isRunning: boolean
  speed: number

  setSimulationTime: (time: Date) => void
  setIsRunning: (running: boolean) => void
  setSpeed: (speed: number) => void
  tick: () => void
}

export const useClockStore = create<ClockState>()((set) => ({
  simulationTime: new Date(),
  isRunning: true,
  speed: 1,

  setSimulationTime: (time) => set({ simulationTime: time }),

  setIsRunning: (running) => set({ isRunning: running }),

  setSpeed: (speed) => set({ speed }),

  tick: () =>
    set((state) => ({
      simulationTime: new Date(state.simulationTime.getTime() + state.speed * 1000),
    })),
}))
