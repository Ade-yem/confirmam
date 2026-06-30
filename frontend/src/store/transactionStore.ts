import { create } from 'zustand'
import type { Transaction } from '../types/transaction'
import { getTransactions } from '../services/api'

interface TransactionState {
  transactions: Transaction[]
  isLoading: boolean
  fetchTransactions: () => Promise<void>
  prependTransaction: (tx: Transaction) => void
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  isLoading: false,
  fetchTransactions: async () => {
    set({ isLoading: true })
    try {
      const txs = await getTransactions()
      set({ transactions: txs, isLoading: false })
    } catch (err) {
      console.error('Error fetching transactions:', err)
      set({ isLoading: false })
    }
  },
  prependTransaction: (tx) => {
    set((state) => ({
      transactions: [tx, ...state.transactions],
    }))
  },
}))
