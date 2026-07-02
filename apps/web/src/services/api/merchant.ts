import { client } from './client'
import type { Merchant } from '@/types/merchant'

export async function getMerchantProfile(): Promise<Merchant> {
  return client.get<Merchant>('/merchant/profile').then((r) => r.data)
}
