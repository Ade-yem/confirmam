import type { Merchant } from '@/types/merchant'
import { useConnectionStore } from '@/store/connectionStore'
import { cn } from '@/utils/cn'

interface MerchantHeaderProps {
  merchant: Merchant
}

function getInitials(name: string): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function MerchantHeader({ merchant }: MerchantHeaderProps) {
  const { networkOnline, sseConnected } = useConnectionStore()
  const isOnline = networkOnline && sseConnected
  const initials = getInitials(merchant.name)
  const greeting = getGreeting()

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 bg-white px-4 md:px-6 rounded-2xl shadow-card">
      <div className="flex items-center gap-3.5">
        {/* Avatar: initials from name, emerald background, rounded-lg */}
        <div 
          aria-hidden="true" 
          className="w-12 h-12 rounded-lg bg-emerald flex items-center justify-center text-white font-bold text-lg shadow-sm"
        >
          {initials}
        </div>
        
        <div>
          <span className="text-[11px] font-semibold text-midnight-40 uppercase tracking-wider block">
            {greeting}
          </span>
          <h2 className="text-lg font-bold text-midnight leading-tight mt-0.5">
            {merchant.name}
          </h2>
        </div>
      </div>

      {/* Connection status pill */}
      <div 
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold select-none border transition-colors",
          isOnline 
            ? "bg-emerald-50 text-emerald border-emerald-100" 
            : "bg-coral/10 text-coral border-coral/20"
        )}
      >
        <span 
          className={cn(
            "w-2 h-2 rounded-full",
            isOnline ? "bg-emerald animate-pulse" : "bg-coral"
          )} 
        />
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  )
}
