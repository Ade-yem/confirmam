import { create } from 'zustand'
import type { AuthResult } from '../types/auth'

interface AuthStore {
  token: string | null
  isAuthenticated: boolean
  user: {
    email: string
    name: string
  } | null
  login: (result: AuthResult) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  isAuthenticated: false,
  user: null,
  login: (result) => {
    set({
      token: result.token,
      isAuthenticated: true,
      user: result.user,
    })
  },
  logout: () => {
    set({
      token: null,
      isAuthenticated: false,
      user: null,
    })
  },
}))
