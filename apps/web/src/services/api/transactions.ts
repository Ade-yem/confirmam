import { client } from './client'
import { TransactionArraySchema } from './schemas'
import type { Transaction } from '@/types/transaction'

export async function getTransactions(date?: string): Promise<Transaction[]> {
  return client
    .get('/transactions', { params: { date } })
    .then((r) => TransactionArraySchema.parse(r.data))
}

