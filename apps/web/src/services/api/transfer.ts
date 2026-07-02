import { client } from './client'
import type { Bank, SendMoneyPayload, TransferResult } from '@/types/transaction'

export async function getBanks(): Promise<Bank[]> {
  return client.get<Bank[]>('/transfers/banks').then((r) => r.data)
}

export async function resolveAccountName(
  bankCode: string, 
  accountNumber: string
): Promise<{ name: string }> {
  return client
    .post<{ name: string }>('/transfers/resolve', { bankCode, accountNumber })
    .then((r) => r.data)
}

export async function sendMoney(payload: SendMoneyPayload): Promise<TransferResult> {
  return client
    .post<TransferResult>('/transfers/send', payload)
    .then((r) => r.data)
}
