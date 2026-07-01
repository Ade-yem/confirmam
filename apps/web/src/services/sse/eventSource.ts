import type { PaymentEvent } from '../../types/payment'
import { subscribeToMockPayments } from './mockEmitter'
import { USE_MOCKS } from '../api/client'

export function connectToPaymentEvents(
  merchantId: string,
  onPayment: (event: PaymentEvent) => void,
  onConnectionChange: (connected: boolean) => void
): () => void {
  if (USE_MOCKS) {
    // Subscribe to browser console events
    const unsubscribeMock = subscribeToMockPayments((event) => {
      onPayment(event)
    })

    // Connect to the Vite dev server SSE middleware
    const url = `${window.location.origin}/events/payments?merchantId=${merchantId}`
    console.log(`[SSE] Connecting to local mock SSE at: ${url}`)
    const source = new EventSource(url)

    source.addEventListener('payment_received', (e) => {
      try {
        const payload = JSON.parse(e.data)
        onPayment(payload)
      } catch (err) {
        console.error('Error parsing mock SSE event data:', err)
      }
    })
    
    source.onopen = () => onConnectionChange(true)
    source.onerror = () => onConnectionChange(false)

    return () => {
      unsubscribeMock()
      source.close()
    }
  }

  // Production SSE connection
  const url = `${import.meta.env.VITE_SSE_BASE_URL}/events/payments?merchantId=${merchantId}`
  console.log(`[SSE] Connecting to production SSE at: ${url}`)
  const source = new EventSource(url)

  source.addEventListener('payment_received', (e) => {
    try {
      const payload = JSON.parse(e.data)
      onPayment(payload)
    } catch (err) {
      console.error('Error parsing SSE event data:', err)
    }
  })
  
  source.onopen = () => onConnectionChange(true)
  source.onerror = () => onConnectionChange(false)

  return () => source.close()
}
