import type { Merchant, DashboardSummary } from '../../../types/merchant'
import type { Transaction } from '../../../types/transaction'

export interface Customer {
  id: string
  name: string
  paymentCount: number
  totalSpent: number
}

export interface WeeklyBar {
  day: string
  amount: number
}

export interface Bank {
  code: string
  name: string
}

export const fixtures = {
  dashboardSummary: {
    todayRevenue: 248500,
    todayPaymentCount: 14,
    yesterdayRevenue: 221000,
    pendingAmount: 0,
    averagePayment: 17750,
  } as DashboardSummary,

  merchant: {
    id: 'merchant_001',
    name: 'Adeyemi Stores',
    location: 'Lagos, NG',
    virtualAccountNumber: '8123456790',
    bankName: 'ConfirmAm Bank',
  } as Merchant,

  transactions: [
    {
      id: 'tx_001',
      direction: 'incoming',
      amount: 5000,
      senderName: 'Adeyemi',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
      status: 'successful',
      reference: 'REF_001',
    },
    {
      id: 'tx_002',
      direction: 'outgoing',
      amount: 32000,
      recipientName: 'Supplier — Tunde',
      recipientBank: 'Access Bank',
      timestamp: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // 1hr 5m ago
      status: 'successful',
      reference: 'REF_002',
    },
    {
      id: 'tx_003',
      direction: 'incoming',
      amount: 12500,
      senderName: 'Emeka Obi',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hrs ago
      status: 'successful',
      reference: 'REF_003',
    },
    {
      id: 'tx_004',
      direction: 'outgoing',
      amount: 4500,
      recipientName: 'Bisi Eatery',
      recipientBank: 'GTBank',
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hrs ago
      status: 'failed',
      reference: 'REF_004',
    },
    {
      id: 'tx_005',
      direction: 'incoming',
      amount: 7200,
      senderName: 'Chioma Nze',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hrs ago
      status: 'pending',
      reference: 'REF_005',
    }
  ] as Transaction[],

  topCustomers: [
    { id: 'c_001', name: 'Adeyemi', paymentCount: 12, totalSpent: 45000 },
    { id: 'c_002', name: 'Emeka Obi', paymentCount: 8, totalSpent: 38000 },
    { id: 'c_003', name: 'Chioma Nze', paymentCount: 5, totalSpent: 22000 },
    { id: 'c_004', name: 'Musa Ibrahim', paymentCount: 4, totalSpent: 18000 },
  ] as Customer[],

  weeklyRevenue: [
    { day: 'Mon', amount: 180000 },
    { day: 'Tue', amount: 240000 },
    { day: 'Wed', amount: 210000 },
    { day: 'Thu', amount: 320000 },
    { day: 'Fri', amount: 280000 },
    { day: 'Sat', amount: 390000 },
    { day: 'Sun', amount: 150000 },
  ] as WeeklyBar[],

  banks: [
    { code: '044', name: 'Access Bank' },
    { code: '057', name: 'Guaranty Trust Bank (GTBank)' },
    { code: '011', name: 'First Bank of Nigeria' },
    { code: '058', name: 'Zenith Bank' },
    { code: '033', name: 'United Bank for Africa (UBA)' },
    { code: '035', name: 'Wema Bank' },
    { code: '50211', name: 'Kuda Bank' },
    { code: '999992', name: 'OPay' },
    { code: '999991', name: 'PalmPay' },
    { code: '50515', name: 'Moniepoint MFB' }
  ] as Bank[],

  names: {
    '8123456790': 'Adeyemi Stores',
    '1234567890': 'Olumide Johnson',
    '0987654321': 'Grace Chinedu',
    '1112223334': 'Kelechi Nwosu',
    '5556667778': 'Fatima Bello'
  } as Record<string, string>
}
