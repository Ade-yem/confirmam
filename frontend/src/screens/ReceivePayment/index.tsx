import { useState } from 'react'
import { usePaymentStore } from '../../store/paymentStore'
import { initiatePaymentSession } from '../../services/api'
import { AmountDisplay } from '../../components/payment/AmountDisplay'
import { VirtualAccountCard } from '../../components/payment/VirtualAccountCard'
import { QRCard } from '../../components/payment/QRCard'
import { ConfirmationOverlay } from './ConfirmationOverlay'
import { ArrowLeft, Loader2, Info } from 'lucide-react'
import { formatNaira } from '../../lib/formatters'

export default function ReceivePaymentScreen() {
  const {
    currentAmount,
    waitingForPayment,
    paymentSession,
    confirmationVisible,
    setAmount,
    setPaymentSession,
    startWaiting,
    dismissConfirmation,
  } = usePaymentStore()

  const [inputAmount, setInputAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000]

  const handleGenerate = async (amountVal: number) => {
    if (!amountVal || amountVal <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const session = await initiatePaymentSession(amountVal)
      setPaymentSession(session)
      setAmount(amountVal)
      startWaiting()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to initiate payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset payment store state
    dismissConfirmation()
    setInputAmount('')
  }

  // Render the confirmation overlay on top if visible
  if (confirmationVisible) {
    return <ConfirmationOverlay />
  }

  // 1. Render amount input screen
  if (!waitingForPayment || !paymentSession) {
    return (
      <div className="p-4 md:p-6 max-w-xl mx-auto flex flex-col justify-center min-h-[80vh]">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-soft">
          <div className="text-center mb-6">
            <span className="text-[11px] font-bold text-emerald tracking-widest uppercase bg-emerald-50 px-3 py-1 rounded-full">
              Receive Payment
            </span>
            <h1 className="text-2xl font-bold text-midnight mt-3">Enter Amount</h1>
            <p className="text-midnight-40 text-xs font-medium mt-1">
              Specify the transfer amount to generate details for the customer
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleGenerate(Number(inputAmount))
            }}
            className="space-y-6"
          >
            {/* Amount Input */}
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-midnight-40">
                ₦
              </span>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                placeholder="0"
                value={inputAmount}
                onChange={(e) => {
                  setInputAmount(e.target.value)
                  setError(null)
                }}
                disabled={loading}
                className="w-full h-16 pl-10 pr-4 text-2xl font-extrabold text-midnight border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 placeholder-gray-300 transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3.5 bg-coral/10 text-coral text-xs font-semibold rounded-xl border border-coral/10">
                <Info className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick amount pills */}
            <div>
              <span className="text-[11px] font-bold text-midnight-60 uppercase tracking-wider block mb-3">
                Quick Amounts
              </span>
              <div className="grid grid-cols-3 gap-2.5">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setInputAmount(amt.toString())
                      handleGenerate(amt)
                    }}
                    disabled={loading}
                    className="h-11 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-midnight text-xs font-bold rounded-xl border border-gray-100 transition-all disabled:opacity-50"
                  >
                    +{formatNaira(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              disabled={loading || !inputAmount}
              className="w-full h-14 bg-emerald hover:bg-emerald-dark text-white font-bold text-base rounded-2xl transition-all shadow-cta select-none flex items-center justify-center gap-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Code...</span>
                </>
              ) : (
                <span>Generate Code</span>
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // 2. Render waiting screen
  return (
    <div className="p-4 md:p-6 lg:p-8 flex flex-col min-h-[85vh]">
      {/* Header section with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Go back and edit amount"
          className="w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-100 flex items-center justify-center text-midnight transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-midnight leading-tight">Waiting for Payment</h1>
          <p className="text-midnight-40 text-xs font-semibold">
            Merchant terminal active
          </p>
        </div>
      </div>

      {/* Main layout container (stacked on mobile, side-by-side on tablet/desktop) */}
      <div className="flex-1 flex flex-col md:flex-row md:items-stretch md:gap-8 lg:gap-16">
        {/* Left column: Amount display, Account details card, Waiting status banner */}
        <div className="flex-1 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-bold text-midnight-40 uppercase tracking-widest block">
                AMOUNT TO PAY
              </span>
              <AmountDisplay amount={currentAmount || 0} size="display" className="mt-1" />
            </div>

            <VirtualAccountCard
              accountNumber={paymentSession.virtualAccountNumber}
              bankName={paymentSession.bankName}
              merchantName={paymentSession.merchantName}
            />
          </div>

          {/* Waiting Pulsing Indicator */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex items-center justify-between shadow-card mb-6 md:mb-0">
            <div className="flex items-center gap-3">
              {/* Pulsing indicator dot */}
              <div className="relative flex h-3.5 w-3.5">
                <span className="animate-waiting-pulse absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald"></span>
              </div>
              <span className="text-sm font-bold text-emerald-dark">
                Waiting for payment...
              </span>
            </div>
            
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs font-bold text-midnight-60 hover:text-midnight underline"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Right column: QR Card */}
        <div className="flex justify-center items-center md:items-start shrink-0">
          <QRCard data={paymentSession.qrCodeData} className="mx-auto md:mx-0 md:h-full md:justify-center" />
        </div>
      </div>
    </div>
  )
}
