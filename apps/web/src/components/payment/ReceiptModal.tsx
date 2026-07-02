import { useState, useRef } from 'react'
import type { Transaction } from '@/types/transaction'
import { StatusBadge } from '../common/StatusBadge'
import { formatNaira, formatDate, formatTime } from '@/lib/formatters'
import { X, Share2, Copy, Check, FileText, ArrowDownLeft, ArrowUpRight, FileImage, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import * as htmlToImage from 'html-to-image'
import { jsPDF } from 'jspdf'

interface ReceiptModalProps {
  transaction: Transaction | null
  onClose: () => void
}

export function ReceiptModal({ transaction, onClose }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [sharePickerOpen, setSharePickerOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const receiptRef = useRef<HTMLDivElement>(null)

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

  // Text fallback format for clipboard copying
  const getReceiptText = () => {
    const sanitizeForReceipt = (str: string): string => {
      if (!str) return ''
      return str.replace(/[^a-zA-Z0-9\s\-.,():/]/g, '')
    }

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

  const handleCopyText = async () => {
    const text = getReceiptText()
    try {
      await navigator.clipboard.writeText(text)
      setToastMessage('Receipt text copied!')
      setToastOpen(true)
      setTimeout(() => setToastOpen(false), 2000)
    } catch (err) {
      console.error('Failed to copy receipt text:', err)
    }
  }

  // Generates and shares/downloads PNG or PDF file
  const handleShareAs = async (format: 'image' | 'pdf') => {
    if (!receiptRef.current) return
    setIsGenerating(true)
    setSharePickerOpen(false)

    try {
      // Small timeout to let the overlay menu close and avoid visual glitch
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Generate high-quality PNG image of the receipt body card
      const dataUrl = await htmlToImage.toPng(receiptRef.current, {
        backgroundColor: '#ffffff',
        style: {
          borderRadius: '0', // Keep clean flat card borders for printing
        },
        pixelRatio: 2, // High resolution scaling
      })

      const fileName = `confirmam_receipt_${reference || 'tx'}`

      if (format === 'image') {
        const response = await fetch(dataUrl)
        const blob = await response.blob()
        const file = new File([blob], `${fileName}.png`, { type: 'image/png' })

        // Check if Web Share API supports file sharing
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'ConfirmAm Receipt',
            text: `Payment Receipt: ${formatNaira(amount)}`,
          })
        } else {
          // Fallback: Trigger direct browser download
          const link = document.createElement('a')
          link.download = `${fileName}.png`
          link.href = dataUrl
          link.click()
          
          setToastMessage('Receipt Image downloaded!')
          setToastOpen(true)
          setTimeout(() => setToastOpen(false), 2000)
        }
      } else {
        // PDF generation
        const imgWidth = receiptRef.current.offsetWidth
        const imgHeight = receiptRef.current.offsetHeight

        const pdf = new jsPDF({
          orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [imgWidth, imgHeight]
        })

        pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight)
        const pdfBlob = pdf.output('blob')
        const file = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' })

        // Check if Web Share API supports file sharing
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'ConfirmAm Receipt',
            text: `Payment Receipt: ${formatNaira(amount)}`,
          })
        } else {
          // Fallback: Trigger direct PDF download
          pdf.save(`${fileName}.pdf`)
          
          setToastMessage('Receipt PDF downloaded!')
          setToastOpen(true)
          setTimeout(() => setToastOpen(false), 2000)
        }
      }
    } catch (err) {
      console.error('Failed to generate sharing file:', err)
      setToastMessage('Generation failed. Please try again.')
      setToastOpen(true)
      setTimeout(() => setToastOpen(false), 2000)
    } finally {
      setIsGenerating(false)
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
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-50 bg-white relative z-20">
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

        {/* Receipt Body (Paper theme container, captured for Image/PDF) */}
        <div 
          ref={receiptRef} 
          className="p-6 space-y-6 bg-white select-none relative"
        >
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
            <StatusBadge status={status} className="mt-1 mx-auto" />
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
        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2 relative z-20">
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setSharePickerOpen(!sharePickerOpen)}
              className="flex-1 h-11 bg-emerald hover:bg-emerald-dark disabled:bg-emerald-light text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 select-none"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
              <span>{isGenerating ? 'Generating...' : 'Share Receipt'}</span>
            </button>
            
            <button
              type="button"
              onClick={handleCopyText}
              className="flex-1 h-11 bg-white border border-gray-200 hover:bg-gray-50 text-midnight font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 select-none"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Text</span>
            </button>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 border border-gray-200 hover:bg-gray-100 text-midnight text-xs font-bold rounded-xl transition-all select-none"
          >
            Close
          </button>
        </div>

        {/* Share format picker Overlay (Slide-up Neumorphic menu) */}
        {sharePickerOpen && (
          <div className="absolute inset-0 bg-midnight/35 backdrop-blur-[2px] z-30 flex flex-col justify-end p-4 animate-fade-in">
            {/* Click backdrop to close picker */}
            <div className="absolute inset-0" onClick={() => setSharePickerOpen(false)} />
            
            <div className="relative z-10 bg-surface rounded-2xl p-4 border border-white/80 shadow-neu-flat animate-spring-in space-y-3">
              <div className="text-center">
                <span className="text-[10px] font-bold text-midnight-40 uppercase tracking-widest">
                  Share Format
                </span>
                <p className="text-xs text-midnight font-semibold mt-0.5">Select preferred file document type</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleShareAs('image')}
                  className="p-4 bg-surface hover:bg-surface border border-white/60 shadow-neu-flat hover:shadow-neu-pressed active:shadow-neu-pressed rounded-xl flex flex-col items-center gap-2 group transition-all text-midnight"
                >
                  <div className="w-9 h-9 rounded-full bg-surface shadow-neu-flat group-hover:shadow-neu-pressed text-emerald flex items-center justify-center transition-all">
                    <FileImage className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-bold">Image (PNG)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShareAs('pdf')}
                  className="p-4 bg-surface hover:bg-surface border border-white/60 shadow-neu-flat hover:shadow-neu-pressed active:shadow-neu-pressed rounded-xl flex flex-col items-center gap-2 group transition-all text-midnight"
                >
                  <div className="w-9 h-9 rounded-full bg-surface shadow-neu-flat group-hover:shadow-neu-pressed text-emerald flex items-center justify-center transition-all">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-[11px] font-bold">Document (PDF)</span>
                </button>
              </div>
              
              <button
                type="button"
                onClick={() => setSharePickerOpen(false)}
                className="w-full h-10 border border-gray-200 bg-white hover:bg-gray-50 text-midnight text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Copy/Download confirmation toast */}
        <div
          className={cn(
            "absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-midnight text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg transition-all duration-300 pointer-events-none z-40 flex items-center gap-1.5",
            toastOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
          )}
        >
          <Check className="w-3.5 h-3.5 text-lime" />
          <span>{toastMessage}</span>
        </div>
      </div>
    </div>
  )
}
