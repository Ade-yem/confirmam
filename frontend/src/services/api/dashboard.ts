import { client, USE_MOCKS } from './client'
import { fixtures } from './mocks/fixtures'
import type { Customer, WeeklyBar } from './mocks/fixtures'
import { mockDelay } from './mocks/delay'
import type { DashboardSummary } from '../../types/merchant'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (USE_MOCKS) {
    return mockDelay(fixtures.dashboardSummary)
  }
  return client.get<DashboardSummary>('/dashboard/summary').then((r) => r.data)
}

export async function getTopCustomers(): Promise<Customer[]> {
  if (USE_MOCKS) {
    return mockDelay(fixtures.topCustomers)
  }
  return client.get<Customer[]>('/dashboard/top-customers').then((r) => r.data)
}

export async function getWeeklyRevenue(): Promise<WeeklyBar[]> {
  if (USE_MOCKS) {
    return mockDelay(fixtures.weeklyRevenue)
  }
  return client.get<WeeklyBar[]>('/dashboard/weekly-revenue').then((r) => r.data)
}
