import { useEffect } from 'react'
import { usePaymentStore } from '@/store/paymentStore'
import { useTransactionStore } from '@/store/transactionStore'
import { useConnectionStore } from '@/store/connectionStore'
import { useMerchantStore } from '@/store/merchantStore'
import { connectToPaymentEvents } from '@/services/sse/eventSource'
import type { PaymentEvent } from '@/types/payment'
import type { Transaction } from '@/types/transaction'

function paymentEventToTransaction(event: PaymentEvent): Transaction {
  return {
    id: `tx_${event.reference}_${Date.now()}`,
    direction: 'incoming',
    amount: event.amount,
    senderName: event.senderName,
    timestamp: event.timestamp || new Date().toISOString(),
    status: 'successful',
    reference: event.reference,
  }
}

export function usePaymentEvents() {
  const handlePaymentReceived = usePaymentStore((s) => s.handlePaymentReceived)
  const prependTransaction = useTransactionStore((s) => s.prependTransaction)
  const setSseConnected = useConnectionStore((s) => s.setSseConnected)
  const updateRevenue = useMerchantStore((s) => s.updateRevenue)
  const merchant = useMerchantStore((s) => s.merchant)

  useEffect(() => {
    if (!merchant?.id) return

    console.log(`[usePaymentEvents] Initializing SSE listener for merchant: ${merchant.id}`)
    
    const cleanup = connectToPaymentEvents(
      merchant.id,
      (event) => {
        console.log('[usePaymentEvents] New payment event received:', event)
        // 1. Process payment store (glow, modal trigger, vibration)
        handlePaymentReceived(event)
        
        // 2. Add to transaction history
        prependTransaction(paymentEventToTransaction(event))
        
        // 3. Dynamically increment revenue and payment count on dashboard
        updateRevenue(event.amount)
      },
      setSseConnected
    )

    return cleanup
  }, [merchant?.id, handlePaymentReceived, prependTransaction, setSseConnected, updateRevenue])
}
