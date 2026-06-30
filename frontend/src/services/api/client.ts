import axios from 'axios'

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Optional response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API client error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)
