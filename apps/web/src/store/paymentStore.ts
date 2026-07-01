import { create } from 'zustand'
import type { PaymentEvent, PaymentSession } from '../types/payment'

interface PaymentState {
  currentAmount: number | null
  waitingForPayment: boolean
  lastPayment: PaymentEvent | null
  confirmationVisible: boolean
  paymentSession: PaymentSession | null
  setAmount: (amount: number | null) => void
  setPaymentSession: (session: PaymentSession | null) => void
  startWaiting: () => void
  handlePaymentReceived: (event: PaymentEvent) => void
  dismissConfirmation: () => void
}

export const usePaymentStore = create<PaymentState>((set) => ({
  currentAmount: null,
  waitingForPayment: false,
  lastPayment: null,
  confirmationVisible: false,
  paymentSession: null,
  setAmount: (currentAmount) => set({ currentAmount }),
  setPaymentSession: (paymentSession) => set({ paymentSession }),
  startWaiting: () => set({ waitingForPayment: true, confirmationVisible: false }),
  handlePaymentReceived: (lastPayment) => {
    // Trigger mobile vibration if available
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(200)
      } catch (err) {
        console.warn('Vibration API not supported or blocked:', err)
      }
    }
    set({
      waitingForPayment: false,
      confirmationVisible: true,
      lastPayment,
    })
  },
  dismissConfirmation: () => set({
    confirmationVisible: false,
    currentAmount: null,
    waitingForPayment: false,
    paymentSession: null,
  }),
}))
