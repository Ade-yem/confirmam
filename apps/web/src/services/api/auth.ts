import { client } from './client'
import type { AuthResult } from '../../types/auth'

export async function loginWithEmail(email: string, password: string): Promise<AuthResult> {
  return client
    .post<AuthResult>('/auth/login', { email, password })
    .then((r) => r.data)
}

export async function loginWithGoogle(): Promise<AuthResult> {
  return client
    .post<AuthResult>('/auth/google')
    .then((r) => r.data)
}

export async function registerBusiness(
  businessName: string,
  email: string,
  password: string
): Promise<AuthResult> {
  return client
    .post<AuthResult>('/auth/register', { businessName, email, password })
    .then((r) => r.data)
}
