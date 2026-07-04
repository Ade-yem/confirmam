import { client } from './client'
import { PaymentSessionSchema } from './schemas'
import type { PaymentSession } from '@/types/payment'

export async function initiatePaymentSession(amount: number): Promise<PaymentSession> {
  return client
    .post('/payments/session', { amount })
    .then((r) => PaymentSessionSchema.parse(r.data))
}

