import axios from 'axios'
import { useAuthStore } from '../../store/authStore'

export class APIError extends Error {
  public override message: string
  public statusCode?: number
  public raw?: any

  constructor(message: string, statusCode?: number, raw?: any) {
    super(message)
    this.message = message
    this.statusCode = statusCode
    this.raw = raw
    this.name = 'APIError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

// Dynamic Authorization Header request interceptor
client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to format errors as APIError
client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const serverData = error.response?.data
      let message = 'An unexpected error occurred. Please try again.'
      const statusCode = error.response?.status

      if (serverData && typeof serverData === 'object') {
        if ('message' in serverData) {
          const msgVal = serverData.message
          if (Array.isArray(msgVal)) {
            message = msgVal.join('. ')
          } else if (typeof msgVal === 'string') {
            message = msgVal
          }
        } else if ('error' in serverData && typeof serverData.error === 'string') {
          message = serverData.error
        }
      } else if (error.message) {
        message = error.message
      }

      return Promise.reject(new APIError(message, statusCode, error))
    }

    if (error instanceof Error) {
      return Promise.reject(new APIError(error.message, undefined, error))
    }

    return Promise.reject(new APIError('An unexpected error occurred.', undefined, error))
  }
)

