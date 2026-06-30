import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { formatAccountNumber } from '../../lib/formatters'
import { cn } from '../../utils/cn'

interface VirtualAccountCardProps {
  accountNumber: string
  bankName: string
  merchantName: string
  className?: string
}

export function VirtualAccountCard({
  accountNumber,
  bankName,
  merchantName,
  className,
}: VirtualAccountCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy account number:', err)
    }
  }

  return (
    <div
      onClick={handleCopy}
      role="button"
      tabIndex={0}
      aria-label={`Virtual account. Bank is ${bankName}, account number is ${accountNumber}, merchant name is ${merchantName}. Tap to copy account number.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCopy()
        }
      }}
      className={cn(
        "relative p-5 bg-emerald text-white rounded-lg shadow-soft select-all cursor-pointer transition-transform active:scale-[0.98] outline-none focus:ring-4 focus:ring-emerald-100",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-widest block">
            RECEIVING BANK
          </span>
          <h3 className="text-base font-bold tracking-tight mt-0.5">{bankName}</h3>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          {copied ? (
            <Check className="w-4 h-4 text-lime" />
          ) : (
            <Copy className="w-4 h-4 text-emerald-50" />
          )}
        </div>
      </div>

      <div className="mt-6">
        <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-widest block">
          ACCOUNT NUMBER
        </span>
        <div className="text-[26px] font-bold tracking-wider leading-none mt-1 font-mono">
          {formatAccountNumber(accountNumber)}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
        <div>
          <span className="text-[11px] font-semibold text-emerald-100 uppercase tracking-widest block">
            ACCOUNT NAME
          </span>
          <span className="text-sm font-semibold tracking-tight block mt-0.5">{merchantName}</span>
        </div>
        <span className="text-[10px] font-medium bg-white/15 px-2.5 py-1 rounded-full text-emerald-50 tracking-wide uppercase">
          Tap to copy
        </span>
      </div>

      {/* Floating feedback toast */}
      <div
        className={cn(
          "absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-midnight text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 pointer-events-none z-10 flex items-center gap-1.5",
          copied ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}
      >
        <Check className="w-3.5 h-3.5 text-lime" />
        <span>Account number copied</span>
      </div>
    </div>
  )
}
