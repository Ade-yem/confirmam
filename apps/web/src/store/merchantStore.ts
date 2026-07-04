import { create } from 'zustand'
import type { Merchant } from '../types/merchant'
import { getMerchantProfile, getDashboardSummary } from '../services/api'

interface MerchantState {
  merchant: Merchant | null
  todayRevenue: number
  todayPaymentCount: number
  isLoading: boolean
  error: string | null
  fetchMerchant: () => Promise<void>
  updateRevenue: (amount: number) => void
}

export const useMerchantStore = create<MerchantState>((set) => ({
  merchant: null,
  todayRevenue: 0,
  todayPaymentCount: 0,
  isLoading: false,
  error: null,
  fetchMerchant: async () => {
    set({ isLoading: true, error: null })
    try {
      const profile = await getMerchantProfile()
      const summary = await getDashboardSummary()
      set({
        merchant: profile,
        todayRevenue: summary.todayRevenue,
        todayPaymentCount: summary.todayPaymentCount,
        isLoading: false,
      })
    } catch (err: any) {
      console.error('Error fetching merchant details:', err)
      set({
        error: err.message || 'Failed to fetch merchant profile.',
        isLoading: false,
      })
    }
  },
  updateRevenue: (amount) => {
    set((state) => ({
      todayRevenue: state.todayRevenue + amount,
      todayPaymentCount: state.todayPaymentCount + 1,
    }))
  }
}))
