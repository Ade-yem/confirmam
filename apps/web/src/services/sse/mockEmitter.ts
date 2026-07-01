import type { PaymentEvent } from '../../types/payment'

type MockPaymentListener = (event: PaymentEvent) => void

let listeners: MockPaymentListener[] = []

export function subscribeToMockPayments(listener: MockPaymentListener): () => void {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

// Bind mock emitter to window object for browser console testing
if (typeof window !== 'undefined') {
  ;(window as any).__mockPaymentEmitter = (payload: Partial<PaymentEvent>) => {
    const event: PaymentEvent = {
      sessionId: payload.sessionId || `sess_mock_${Math.random().toString(36).substring(2, 9)}`,
      amount: payload.amount || 5000,
      senderName: payload.senderName || 'Adeyemi',
      senderBank: payload.senderBank || 'Access Bank',
      timestamp: payload.timestamp || new Date().toISOString(),
      reference: payload.reference || `REF_MOCK_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    }
    
    console.log('[MockEmitter] Emitting mock payment:', event)
    listeners.forEach((l) => l(event))
  }
  
  console.log(
    '%cConfirmAm Mock Emitter Loaded!',
    'color: #0F8F5F; font-weight: bold; font-size: 14px;'
  )
  console.log(
    'Trigger a mock payment in the console by calling:\n' +
    '__mockPaymentEmitter({ amount: 7500, senderName: "Tunde" })'
  )
}
