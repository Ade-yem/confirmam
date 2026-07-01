export interface Merchant {
  id: string
  name: string
  location?: string
  virtualAccountNumber: string
  bankName: string
}

export interface DashboardSummary {
  todayRevenue: number
  todayPaymentCount: number
  yesterdayRevenue: number              // Used to calculate % change
  pendingAmount: number
  averagePayment: number
}
