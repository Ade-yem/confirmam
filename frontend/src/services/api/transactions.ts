import { client, USE_MOCKS } from './client'
import { fixtures } from './mocks/fixtures'
import { mockDelay } from './mocks/delay'
import type { Transaction } from '../../types/transaction'

export async function getTransactions(date?: string): Promise<Transaction[]> {
  if (USE_MOCKS) {
    return mockDelay(fixtures.transactions)
  }
  return client
    .get<Transaction[]>('/transactions', { params: { date } })
    .then((r) => r.data)
}
