import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { usePaymentEvents } from '../hooks/usePaymentEvents'
import { useConnection } from '../hooks/useConnection'
import { useMerchantStore } from '../store/merchantStore'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const fetchMerchant = useMerchantStore((s) => s.fetchMerchant)

  // 1. Initialize browser online/offline event listeners
  useConnection()

  // 2. Fetch merchant profile & daily dashboard summaries on app start
  useEffect(() => {
    fetchMerchant()
  }, [fetchMerchant])

  // 3. Initialize real-time global SSE payment listener (dependent on merchant.id loading)
  usePaymentEvents()

  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}
