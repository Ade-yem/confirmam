import { client } from './client'
import { DashboardSummarySchema, CustomerArraySchema, WeeklyBarArraySchema } from './schemas'
import type { Customer, WeeklyBar, DashboardSummary } from '@/types/merchant'

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return client
    .get('/dashboard/summary')
    .then((r) => DashboardSummarySchema.parse(r.data))
}

export async function getTopCustomers(): Promise<Customer[]> {
  return client
    .get('/dashboard/top-customers')
    .then((r) => CustomerArraySchema.parse(r.data))
}

export async function getWeeklyRevenue(): Promise<WeeklyBar[]> {
  return client
    .get('/dashboard/weekly-revenue')
    .then((r) => WeeklyBarArraySchema.parse(r.data))
}

