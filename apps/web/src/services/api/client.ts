import axios from 'axios'
import { fixtures } from './mocks/fixtures'
import { mockDelay } from './mocks/delay'

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Centralized Mock Adapter using Axios Interceptors
if (USE_MOCKS) {
  client.interceptors.request.use(async (config) => {
    // Inject mock latency
    await mockDelay(null)

    const url = config.url || ''
    let mockData: any = null

    // Route matching rules to generate mock payloads
    if (url.includes('/merchant/profile')) {
      mockData = fixtures.merchant
    } else if (url.includes('/payments/session')) {
      const amount = config.data?.amount || 0
      const sessionId = `sess_${Math.random().toString(36).substring(2, 11)}`
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
      
      mockData = {
        sessionId,
        virtualAccountNumber: fixtures.merchant.virtualAccountNumber,
        bankName: fixtures.merchant.bankName,
        merchantName: fixtures.merchant.name,
        amount,
        qrCodeData: `confirmam://pay?merchantId=${fixtures.merchant.id}&sessionId=${sessionId}&amount=${amount}`,
        expiresAt,
      }
    } else if (url.includes('/transfers/banks')) {
      mockData = fixtures.banks
    } else if (url.includes('/transfers/resolve')) {
      const accountNumber = config.data?.accountNumber || ''
      if (fixtures.names[accountNumber]) {
        mockData = { name: fixtures.names[accountNumber] }
      } else if (accountNumber && accountNumber.startsWith('9')) {
        mockData = { name: 'Simulated Merchant Corp' }
      } else {
        // Return a mock-rejected error to simulate API resolution failure
        return Promise.reject({
          __isMockResponse: true,
          error: new Error('Unable to verify this account. Check the number and try again.'),
          status: 400,
          config,
        })
      }
    } else if (url.includes('/transfers/send')) {
      mockData = {
        reference: `ref_send_${Math.random().toString(36).substring(2, 11)}`,
        status: 'successful',
        timestamp: new Date().toISOString(),
      }
    } else if (url.includes('/transactions')) {
      mockData = fixtures.transactions
    } else if (url.includes('/dashboard/summary')) {
      mockData = fixtures.dashboardSummary
    } else if (url.includes('/dashboard/top-customers')) {
      mockData = fixtures.topCustomers
    } else if (url.includes('/dashboard/weekly-revenue')) {
      mockData = fixtures.weeklyRevenue
    } else if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/google')) {
      mockData = {
        token: `mock-token-${Math.random().toString(36).substring(2, 11)}`,
        user: {
          email: config.data?.email || 'google-user@confirmam.com',
          name: config.data?.businessName || 'Adeyemi Daniels',
        },
      }
    }

    // Short-circuit the active request by rejecting the promise with mock metadata
    return Promise.reject({
      __isMockResponse: true,
      response: {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      },
    })
  })
}

// Response interceptor
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // If it was a short-circuited mock request
    if (error && error.__isMockResponse) {
      if (error.error) {
        // Return verification error payload directly to callers
        return Promise.reject(error.error)
      }
      return Promise.resolve(error.response)
    }

    console.error('API client error:', error.response?.data || error.message)

    if (error.response?.data?.message) {
      const serverMessage = error.response.data.message;
      const parsedMessage = Array.isArray(serverMessage)
        ? serverMessage.join(', ')
        : serverMessage;
      
      const enrichedError = new Error(parsedMessage);
      Object.defineProperty(enrichedError, 'response', { value: error.response, enumerable: true });
      Object.defineProperty(enrichedError, 'request', { value: error.request, enumerable: true });
      Object.defineProperty(enrichedError, 'config', { value: error.config, enumerable: true });
      return Promise.reject(enrichedError);
    }

    return Promise.reject(error)
  }
)
