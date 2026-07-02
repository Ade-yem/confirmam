import { useEffect } from 'react'
import { useConnectionStore } from '@/store/connectionStore'

export function useConnection() {
  const setNetworkOnline = useConnectionStore((s) => s.setNetworkOnline)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => setNetworkOnline(true)
    const handleOffline = () => setNetworkOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial network online status on mount
    setNetworkOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setNetworkOnline])
}
