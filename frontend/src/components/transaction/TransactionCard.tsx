import type { Transaction } from '../../types/transaction'
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { StatusBadge } from '../common/StatusBadge'
import { formatNaira, formatTime } from '../../lib/formatters'
import { cn } from '../../utils/cn'

interface TransactionCardProps {
  transaction: Transaction
  onClick?: () => void
}

export function TransactionCard({ transaction, onClick }: TransactionCardProps) {
  const { direction, amount, senderName, recipientName, recipientBank, timestamp, status } = transaction
  const timeStr = formatTime(timestamp)
  
  const isIncoming = direction === 'incoming'
  
  // Format numeric values in text for screen reader accessibility
  // e.g. "five thousand"
  const amountWords = amount.toLocaleString('en-US') + ' naira'
  
  // Generate screen reader friendly labels
  const ariaLabel = isIncoming
    ? `Incoming payment of ${amountWords} from ${senderName || 'Unknown'}, ${status}, ${timeStr}`
    : `Outgoing transfer of ${amountWords} to ${recipientName || 'Unknown'}${recipientBank ? ` at ${recipientBank}` : ''}, ${status}, ${timeStr}`

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "flex items-center justify-between p-4 bg-surface rounded-lg shadow-neu-flat hover:shadow-neu-pressed active:shadow-neu-pressed transition-all cursor-pointer select-none",
        "border border-white/50 focus:outline-none focus:ring-2 focus:ring-emerald focus:ring-offset-1"
      )}
    >
      <div className="flex items-center gap-3.5">
        {/* Direction Indicator */}
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center border",
            isIncoming
              ? "bg-emerald-50 text-emerald border-emerald-100"
              : "bg-blue-50 text-blue-600 border-blue-100"
          )}
        >
          {isIncoming ? (
            <ArrowDownLeft className="w-5 h-5" />
          ) : (
            <ArrowUpRight className="w-5 h-5" />
          )}
        </div>

        {/* Sender / Recipient details */}
        <div>
          <h4 className="text-sm font-semibold text-midnight leading-tight">
            {isIncoming ? senderName : recipientName}
          </h4>
          <span className="text-[11px] font-semibold text-midnight-40 mt-1 block">
            {timeStr}
          </span>
        </div>
      </div>

      {/* Amount and Status Badge */}
      <div className="text-right flex flex-col items-end gap-1.5">
        <span
          className={cn(
            "text-base font-bold",
            isIncoming ? "text-emerald" : "text-midnight"
          )}
        >
          {isIncoming ? `+${formatNaira(amount)}` : `-${formatNaira(amount)}`}
        </span>
        <StatusBadge status={status} />
      </div>
    </div>
  )
}
