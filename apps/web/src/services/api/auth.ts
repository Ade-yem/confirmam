import { client } from './client'
import { AuthResultSchema } from './schemas'
import type { AuthResult } from '@/types/auth'

export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  return client
    .post('/auth/login', { email, password })
    .then((r) => AuthResultSchema.parse(r.data))
}

export async function loginWithGoogle() {
  return client
    .get('/auth/google')
}

export async function registerBusiness(
  businessName: string,
  email: string,
  password: string
): Promise<AuthResult> {
  return client
    .post('/auth/register', { businessName, email, password })
    .then((r) => AuthResultSchema.parse(r.data))
}

