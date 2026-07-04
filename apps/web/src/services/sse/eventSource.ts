import type { PaymentEvent } from '@/types/payment'

export function connectToPaymentEvents(
  merchantId: string,
  onPayment: (event: PaymentEvent) => void,
  onConnectionChange: (connected: boolean) => void
): () => void {
  // Production SSE connection
  const sseBaseUrl = import.meta.env.VITE_API_BASE_URL || ""
  const url = `${sseBaseUrl}/events/payments?merchantId=${merchantId}`
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
