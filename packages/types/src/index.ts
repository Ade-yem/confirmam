export interface AuthResult {
  token: string;
  user: {
    email: string;
    name: string;
  };
}

export interface Merchant {
  id: string;
  name: string;
  location?: string;
  virtualAccountNumber: string;
  bankName: string;
}

export interface DashboardSummary {
  todayRevenue: number;
  todayPaymentCount: number;
  yesterdayRevenue: number; // Used to calculate % change
  pendingAmount: number;
  averagePayment: number;
}

export interface Customer {
  id: string;
  name: string;
  paymentCount: number;
  totalSpent: number;
}

export interface WeeklyBar {
  day: string;
  amount: number;
}

export interface Bank {
  code: string;
  name: string;
}

export interface PaymentSession {
  sessionId: string;
  virtualAccountNumber: string;
  bankName: string;
  merchantName: string;
  amount: number;
  expiresAt: string; // ISO timestamp
}

export interface PaymentEvent {
  sessionId: string;
  amount: number; // Naira, whole number
  senderName: string;
  senderBank?: string;
  timestamp: string; // ISO 8601 UTC
  reference: string;
}

export type SSEEvent = PaymentEvent;

export interface Transaction {
  id: string;
  direction: 'incoming' | 'outgoing';
  amount: number; // Naira, whole number
  senderName?: string; // Populated for incoming
  recipientName?: string; // Populated for outgoing
  recipientBank?: string;
  timestamp: string; // ISO 8601 UTC
  status: 'successful' | 'pending' | 'failed';
  reference: string;
}

export interface SendMoneyPayload {
  recipientBank: string;
  recipientAccountNumber: string;
  recipientName: string; // As resolved by the API
  amount: number;
}

export interface TransferResult {
  reference: string;
  status: 'successful' | 'pending' | 'failed';
  timestamp: string;
}

export interface NombaWebhookPayload {
  event: string;
  data: {
    reference: string;
    amount: number;
    accountNumber: string;
    status: string;
    settledAt: string;
  };
}
