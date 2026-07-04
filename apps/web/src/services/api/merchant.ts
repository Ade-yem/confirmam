import { client } from './client'
import { MerchantSchema } from './schemas'
import type { Merchant } from '@/types/merchant'

export async function getMerchantProfile(): Promise<Merchant> {
  return client
    .get('/merchant/profile')
    .then((r) => MerchantSchema.parse(r.data))
}

