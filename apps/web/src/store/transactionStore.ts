import { create } from 'zustand'
import type { Transaction } from '../types/transaction'
import { getTransactions } from '../services/api'

interface TransactionState {
  transactions: Transaction[]
  isLoading: boolean
  error: string | null
  fetchTransactions: () => Promise<void>
  prependTransaction: (tx: Transaction) => void
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  isLoading: false,
  error: null,
  fetchTransactions: async () => {
    set({ isLoading: true, error: null })
    try {
      const txs = await getTransactions()
      set({ transactions: txs, isLoading: false })
    } catch (err: any) {
      console.error('Error fetching transactions:', err)
      set({ error: err.message || 'Failed to fetch transactions.', isLoading: false })
    }
  },
  prependTransaction: (tx) => {
    set((state) => ({
      transactions: [tx, ...state.transactions],
    }))
  },
}))
