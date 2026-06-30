import { useState } from 'react'
import type { Transaction } from '../../types/transaction'
import { StatusBadge } from '../common/StatusBadge'
import { formatNaira, formatDate, formatTime } from '../../lib/formatters'
import { X, Share2, Copy, Check, FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ReceiptModalProps {
  transaction: Transaction | null
  onClose: () => void
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  if (!transaction) return null

  const { direction, amount, senderName, recipientName, recipientBank, timestamp, status, reference } = transaction
  const isIncoming = direction === 'incoming'
  const timeStr = formatTime(timestamp)
  const dateStr = formatDate(timestamp)

  const handleCopyRef = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy reference:', err)
    }
  }

  const sanitizeForReceipt = (str: string): string => {
    if (!str) return ''
    // Allow alphanumeric characters, spaces, hyphens, periods, commas, colons, slashes, and parentheses.
    // Strip control characters and shell triggers ($, ;, &, |, <, >, etc.)
    return str.replace(/[^a-zA-Z0-9\s\-.,():/]/g, '')
  }

  // Generates a clean text receipt to share or copy
  const getReceiptText = () => {
    const cleanSender = sanitizeForReceipt(senderName || '')
    const cleanRecipient = sanitizeForReceipt(recipientName || '')
    const cleanBank = sanitizeForReceipt(recipientBank || '')
    const cleanRef = sanitizeForReceipt(reference || '')

    const header = `=== CONFIRMAM TRANSACTION RECEIPT ===\n`
    const type = `Type: ${isIncoming ? 'Received Payment' : 'Sent Transfer'}\n`
    const amountLine = `Amount: ${formatNaira(amount)}\n`
    const party = isIncoming 
      ? `Sender: ${cleanSender || 'N/A'}\n` 
      : `Recipient: ${cleanRecipient || 'N/A'}${cleanBank ? ` (${cleanBank})` : ''}\n`
    const timeLine = `Date: ${dateStr} ${timeStr}\n`
    const statusLine = `Status: ${status.toUpperCase()}\n`
    const refLine = `Reference: ${cleanRef}\n`
    const footer = `====================================`
    return `${header}${type}${amountLine}${party}${timeLine}${statusLine}${refLine}${footer}`
  }


  const handleShare = async () => {
    const text = getReceiptText()
    
    if (typeof navigator.share !== 'undefined') {
      try {
        await navigator.share({
          title: 'ConfirmAm Transaction Receipt',
          text: text,
        })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch (err) {
        // Ignore user cancellation
        if ((err as Error).name !== 'AbortError') {
          console.error('Failed to share:', err)
        }
      }
    } else {
      // Fallback: Copy full text receipt to clipboard
      try {
        await navigator.clipboard.writeText(text)
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      } catch (err) {
        console.error('Failed to copy receipt text:', err)
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/60 backdrop-blur-sm animate-fade-in"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Receipt Card Wrapper */}
      <div 
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-soft overflow-hidden animate-spring-in border border-gray-100 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald" />
            <span id="receipt-title" className="text-xs font-bold text-midnight uppercase tracking-wider">
              Receipt Details
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close receipt modal"
            className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center text-midnight-60 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Receipt Body (Paper theme) */}
        <div className="p-6 space-y-6">
          
          {/* Status & Amount Header */}
          <div className="text-center space-y-2">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center border mx-auto",
                isIncoming
                  ? "bg-emerald-50 text-emerald border-emerald-100"
                  : "bg-blue-50 text-blue-600 border-blue-100"
              )}
            >
              {isIncoming ? (
                <ArrowDownLeft className="w-6 h-6" />
              ) : (
                <ArrowUpRight className="w-6 h-6" />
              )}
            </div>

            <span className="text-[10px] font-bold text-midnight-40 uppercase tracking-widest block pt-1">
              {isIncoming ? 'Received Payment' : 'Sent Transfer'}
            </span>
            <div className="text-3xl font-extrabold text-midnight tracking-tight select-all">
              {formatNaira(amount)}
            </div>
            <StatusBadge status={status} className="mt-1" />
          </div>

          {/* Receipt Dotted line separator */}
          <div className="relative border-t-2 border-dashed border-gray-200 py-1">
            <div className="absolute -left-8 -top-2 w-4 h-4 rounded-full bg-midnight/60 backdrop-blur-sm" />
            <div className="absolute -right-8 -top-2 w-4 h-4 rounded-full bg-midnight/60 backdrop-blur-sm" />
          </div>

          {/* Transaction Metadata Grid */}
          <div className="space-y-4 text-xs font-semibold text-midnight-60 select-all">
            <div className="flex justify-between items-start">
              <span className="text-midnight-40 font-bold uppercase tracking-wider">
                {isIncoming ? 'Sender' : 'Recipient'}
              </span>
              <span className="text-midnight text-right font-bold break-all max-w-[200px]">
                {isIncoming ? senderName : recipientName}
              </span>
            </div>

            {!isIncoming && recipientBank && (
              <div className="flex justify-between items-center">
                <span className="text-midnight-40 font-bold uppercase tracking-wider">Bank</span>
                <span className="text-midnight text-right">{recipientBank}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-midnight-40 font-bold uppercase tracking-wider">Date</span>
              <span className="text-midnight text-right">{dateStr}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-midnight-40 font-bold uppercase tracking-wider">Time</span>
              <span className="text-midnight text-right">{timeStr}</span>
            </div>

            <div className="flex justify-between items-start pt-3 border-t border-gray-50">
              <span className="text-midnight-40 font-bold uppercase tracking-wider">Reference</span>
              <div className="flex items-center gap-1.5 text-right">
                <span className="text-midnight font-mono select-all text-[11px] max-w-[140px] truncate">{reference}</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="p-1 rounded bg-gray-50 hover:bg-gray-100 text-midnight-60 transition-colors"
                  title="Copy reference code"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={handleShare}
            className="flex-1 h-12 bg-emerald hover:bg-emerald-dark text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 select-none"
          >
            <Share2 className="w-4 h-4" />
            <span>{typeof navigator.share !== 'undefined' ? 'Share Receipt' : 'Copy Receipt'}</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-6 border border-gray-200 hover:bg-gray-100 text-midnight text-xs font-bold rounded-xl transition-all select-none"
          >
            Close
          </button>
        </div>

        {/* Copy confirmation toast */}
        <div
          className={cn(
            "absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-midnight text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg transition-all duration-300 pointer-events-none z-10 flex items-center gap-1.5",
            shared ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <Check className="w-3.5 h-3.5 text-lime" />
          <span>{typeof navigator.share !== 'undefined' ? 'Receipt shared!' : 'Receipt copied to clipboard!'}</span>
        </div>
      </div>
    </div>
  )
}
