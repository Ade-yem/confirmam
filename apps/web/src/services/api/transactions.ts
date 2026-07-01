import { client } from './client'
import type { Transaction } from '../../types/transaction'

export async function getTransactions(date?: string): Promise<Transaction[]> {
  return client
    .get<Transaction[]>('/transactions', { params: { date } })
    .then((r) => r.data)
}
