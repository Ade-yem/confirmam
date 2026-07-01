import { create } from 'zustand'

interface ConnectionState {
  sseConnected: boolean
  networkOnline: boolean
  setSseConnected: (v: boolean) => void
  setNetworkOnline: (v: boolean) => void
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  sseConnected: true,
  networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  setSseConnected: (sseConnected) => set({ sseConnected }),
  setNetworkOnline: (networkOnline) => set({ networkOnline }),
}))
