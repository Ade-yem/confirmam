import { client } from './client'
import { BankArraySchema, ResolveAccountSchema, TransferResultSchema } from './schemas'
import type { Bank, SendMoneyPayload, TransferResult } from '@/types/transaction'

export async function getBanks(): Promise<Bank[]> {
  return client
    .get('/transfers/banks')
    .then((r) => BankArraySchema.parse(r.data))
}

export async function resolveAccountName(
  bankCode: string, 
  accountNumber: string
): Promise<{ name: string }> {
  return client
    .post('/transfers/resolve', { bankCode, accountNumber })
    .then((r) => ResolveAccountSchema.parse(r.data))
}

export async function sendMoney(payload: SendMoneyPayload): Promise<TransferResult> {
  return client
    .post('/transfers/send', payload)
    .then((r) => TransferResultSchema.parse(r.data))
}

