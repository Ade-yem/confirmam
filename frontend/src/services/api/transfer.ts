import { client, USE_MOCKS } from './client'
import { fixtures } from './mocks/fixtures'
import type { Bank } from './mocks/fixtures'
import { mockDelay } from './mocks/delay'
import type { SendMoneyPayload, TransferResult } from '../../types/transaction'

export async function getBanks(): Promise<Bank[]> {
  if (USE_MOCKS) {
    return mockDelay(fixtures.banks)
  }
  return client.get<Bank[]>('/transfers/banks').then((r) => r.data)
}

export async function resolveAccountName(
  bankCode: string, 
  accountNumber: string
): Promise<{ name: string }> {
  if (USE_MOCKS) {
    // If the account number exists in our fixtures list, resolve it.
    // Otherwise, simulate a mismatch/failure or return a generated name.
    if (fixtures.names[accountNumber]) {
      return mockDelay({ name: fixtures.names[accountNumber] })
    }
    
    // Simulating validation error for numbers not in mock config
    if (accountNumber.startsWith('9')) {
      return mockDelay({ name: 'Simulated Merchant Corp' })
    }
    
    throw new Error('Unable to verify this account. Check the number and try again.')
  }

  return client
    .post<{ name: string }>('/transfers/resolve', { bankCode, accountNumber })
    .then((r) => r.data)
}

export async function sendMoney(payload: SendMoneyPayload): Promise<TransferResult> {
  if (USE_MOCKS) {
    return mockDelay({
      reference: `ref_send_${Math.random().toString(36).substring(2, 11)}`,
      status: 'successful',
      timestamp: new Date().toISOString(),
    })
  }

  return client
    .post<TransferResult>('/transfers/send', payload)
    .then((r) => r.data)
}
