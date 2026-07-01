import { create } from 'zustand'
import type { Merchant } from '../types/merchant'
import { getMerchantProfile, getDashboardSummary } from '../services/api'

interface MerchantState {
  merchant: Merchant | null
  todayRevenue: number
  todayPaymentCount: number
  isLoading: boolean
  fetchMerchant: () => Promise<void>
  updateRevenue: (amount: number) => void
}

export const useMerchantStore = create<MerchantState>((set) => ({
  merchant: null,
  todayRevenue: 0,
  todayPaymentCount: 0,
  isLoading: false,
  fetchMerchant: async () => {
    set({ isLoading: true })
    try {
      // Import dynamically or directly from the API service
      const profile = await getMerchantProfile()
      const summary = await getDashboardSummary()
      set({
        merchant: profile,
        todayRevenue: summary.todayRevenue,
        todayPaymentCount: summary.todayPaymentCount,
        isLoading: false
      })
    } catch (err) {
      console.error('Error fetching merchant details:', err)
      set({ isLoading: false })
    }
  },
  updateRevenue: (amount) => {
    set((state) => ({
      todayRevenue: state.todayRevenue + amount,
      todayPaymentCount: state.todayPaymentCount + 1,
    }))
  }
}))
