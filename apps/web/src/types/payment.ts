export interface PaymentSession {
  sessionId: string
  virtualAccountNumber: string
  bankName: string
  merchantName: string
  amount: number
  qrCodeData: string                    // Raw string for QR generation
  expiresAt: string                     // ISO 8601 UTC
}

export interface PaymentEvent {
  sessionId: string
  amount: number                        // Naira, whole number
  senderName: string
  senderBank?: string
  timestamp: string                     // ISO 8601 UTC
  reference: string
}
