import { client, USE_MOCKS } from './client'
import { fixtures } from './mocks/fixtures'
import { mockDelay } from './mocks/delay'
import type { Merchant } from '../../types/merchant'

export async function getMerchantProfile(): Promise<Merchant> {
  if (USE_MOCKS) {
    return mockDelay(fixtures.merchant)
  }
  return client.get<Merchant>('/merchant/profile').then((r) => r.data)
}
