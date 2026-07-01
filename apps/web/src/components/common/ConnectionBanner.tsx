import { useConnectionStore } from '../../store/connectionStore'
import { Loader2, WifiOff, AlertTriangle } from 'lucide-react'

export function ConnectionBanner() {
  const { networkOnline, sseConnected } = useConnectionStore()

  if (networkOnline && sseConnected) {
    return null
  }

  const isOffline = !networkOnline
  const bgClass = isOffline ? 'bg-amber text-midnight font-medium' : 'bg-coral text-white font-medium'
  const text = isOffline 
    ? "You're offline. Reconnecting…" 
    : "Live payments paused. Reconnecting…"

  return (
    <div 
      id="connection-banner"
      role="alert"
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2.5 px-4 text-sm ${bgClass} transition-all duration-300 shadow-sm`}
    >
      {isOffline ? (
        <WifiOff className="w-4 h-4 animate-pulse" />
      ) : (
        <AlertTriangle className="w-4 h-4 animate-pulse" />
      )}
      <span>{text}</span>
      <Loader2 className="w-3.5 h-3.5 animate-spin ml-1" />
    </div>
  )
}
