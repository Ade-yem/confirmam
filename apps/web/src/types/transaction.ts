export interface Transaction {
  id: string
  direction: 'incoming' | 'outgoing'
  amount: number                        // Naira, whole number
  senderName?: string                   // Populated for incoming
  recipientName?: string                // Populated for outgoing
  recipientBank?: string
  timestamp: string                     // ISO 8601 UTC
  status: 'successful' | 'pending' | 'failed'
  reference: string
}

export interface SendMoneyPayload {
  recipientBank: string
  recipientAccountNumber: string
  recipientName: string                 // As resolved by the API
  amount: number
}

export interface TransferResult {
  reference: string
  status: 'successful' | 'pending' | 'failed'
  timestamp: string
}
