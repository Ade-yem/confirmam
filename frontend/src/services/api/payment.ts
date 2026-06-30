import { client, USE_MOCKS } from './client'
import { fixtures } from './mocks/fixtures'
import { mockDelay } from './mocks/delay'
import type { PaymentSession } from '../../types/payment'

export async function initiatePaymentSession(amount: number): Promise<PaymentSession> {
  if (USE_MOCKS) {
    const sessionId = `sess_${Math.random().toString(36).substring(2, 11)}`
    // Expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    
    return mockDelay({
      sessionId,
      virtualAccountNumber: fixtures.merchant.virtualAccountNumber,
      bankName: fixtures.merchant.bankName,
      merchantName: fixtures.merchant.name,
      amount,
      qrCodeData: `confirmam://pay?merchantId=${fixtures.merchant.id}&sessionId=${sessionId}&amount=${amount}`,
      expiresAt,
    })
  }

  return client
    .post<PaymentSession>('/payments/session', { amount })
    .then((r) => r.data)
}
