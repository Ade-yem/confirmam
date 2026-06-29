export type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'expired'

export interface Transaction {
  id: string
  amount: number
  vaNumber: string
  ussdString: string
  status: TransactionStatus
  merchantId: string
  createdAt: string
  confirmedAt?: string
}

export interface VAResponse {
  transactionId: string
  vaNumber: string
  ussdString: string
  amount: number
  expiresAt: string
}

export interface NombaWebhookPayload {
  event: string
  data: {
    reference: string
    amount: number
    accountNumber: string
    status: string
    settledAt: string
  }
}

export interface SSEEvent {
  type: 'payment_confirmed' | 'payment_failed' | 'payment_pending'
  transactionId: string
  amount: number
  timestamp: string
}
