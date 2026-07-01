import { client } from './client'
import type { Customer, WeeklyBar } from './mocks/fixtures'
import type { DashboardSummary } from '../../types/merchant'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return client.get<DashboardSummary>('/dashboard/summary').then((r) => r.data)
}

export async function getTopCustomers(): Promise<Customer[]> {
  return client.get<Customer[]>('/dashboard/top-customers').then((r) => r.data)
}

export async function getWeeklyRevenue(): Promise<WeeklyBar[]> {
  return client.get<WeeklyBar[]>('/dashboard/weekly-revenue').then((r) => r.data)
}
