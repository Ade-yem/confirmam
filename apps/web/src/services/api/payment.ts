import { client } from './client'
import type { PaymentSession } from '@/types/payment'

export async function initiatePaymentSession(amount: number): Promise<PaymentSession> {
  return client
    .post<PaymentSession>('/payments/session', { amount })
    .then((r) => r.data)
}
