import { z } from 'zod'

export const UserSchema = z.object({
  email: z.string(),
  name: z.string(),
})

export const AuthResultSchema = z.object({
  token: z.string(),
  user: UserSchema,
})

export const MerchantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().optional(),
  location: z.string().optional(),
  bankName: z.string().catch('').default(''),
  virtualAccountNumber: z.string().catch('').default(''),
})

export const DashboardSummarySchema = z.object({
  todayRevenue: z.number(),
  todayPaymentCount: z.number(),
  yesterdayRevenue: z.number(),
  pendingAmount: z.number(),
  averagePayment: z.number(),
})

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  paymentCount: z.number(),
  totalSpent: z.number(),
})

export const CustomerArraySchema = z.array(CustomerSchema)

export const WeeklyBarSchema = z.object({
  day: z.string(),
  amount: z.number(),
})

export const WeeklyBarArraySchema = z.array(WeeklyBarSchema)

export const BankSchema = z.object({
  code: z.string(),
  name: z.string(),
})

export const BankArraySchema = z.array(BankSchema)

export const PaymentSessionSchema = z.object({
  sessionId: z.string(),
  virtualAccountNumber: z.string(),
  bankName: z.string(),
  merchantName: z.string(),
  amount: z.number(),
  expiresAt: z.string(),
})

export const PaymentEventSchema = z.object({
  sessionId: z.string(),
  amount: z.number(),
  senderName: z.string(),
  senderBank: z.string().optional(),
  timestamp: z.string(),
  reference: z.string(),
})

export const TransactionSchema = z.object({
  id: z.string(),
  direction: z.enum(['incoming', 'outgoing']),
  amount: z.number(),
  senderName: z.string().optional(),
  recipientName: z.string().optional(),
  recipientBank: z.string().optional(),
  timestamp: z.string(),
  status: z.enum(['successful', 'pending', 'failed']),
  reference: z.string(),
})

export const TransactionArraySchema = z.array(TransactionSchema)

export const TransferResultSchema = z.object({
  reference: z.string(),
  status: z.enum(['successful', 'pending', 'failed']),
  timestamp: z.string(),
})

export const ResolveAccountSchema = z.object({
  name: z.string(),
})

