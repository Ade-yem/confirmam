import { useEffect } from 'react'
import { usePaymentStore } from '../../store/paymentStore'
import { useVoice } from '../../hooks/useVoice'
import { AmountDisplay } from '../../components/payment/AmountDisplay'
import { VoiceIndicator } from '../../components/common/VoiceIndicator'
import { Check } from 'lucide-react'
import { formatTime } from '../../lib/formatters'

export function ConfirmationOverlay() {
  const { lastPayment, dismissConfirmation } = usePaymentStore()
  const { speak, isSpeaking } = useVoice()

  useEffect(() => {
    if (lastPayment) {
      // Speak the amount as plain digits (SpeechSynthesis speaks it naturally)
      const textToSpeak = `Payment of ${lastPayment.amount} Naira received from ${lastPayment.senderName}`
      speak(textToSpeak)
    }
  }, [lastPayment, speak])

  // Auto-dismiss the confirmation screen after 4.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      dismissConfirmation()
    }, 4500)
    return () => clearTimeout(timer)
  }, [dismissConfirmation])

  if (!lastPayment) return null

  const timeStr = formatTime(lastPayment.timestamp)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Payment success: ${lastPayment.amount} Naira received from ${lastPayment.senderName}`}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[radial-gradient(circle_at_center,_#E8F6EF_0%,_#FAFAF8_100%)] animate-fade-in"
    >
      {/* Top Section: Spacers or branding */}
      <div className="w-full flex justify-center pt-8">
        <VoiceIndicator 
          isSpeaking={isSpeaking} 
          text={`Announcing payment...`} 
        />
      </div>

      {/* Middle Section: Checkmark and Transaction Details */}
      <div className="flex flex-col items-center justify-center text-center max-w-md w-full px-4">
        {/* Animated Checkmark ring */}
        <div 
          className="w-24 h-24 rounded-full bg-emerald flex items-center justify-center text-white shadow-cta border-4 border-white mb-6 animate-spring-in"
        >
          <Check className="w-12 h-12 stroke-[2.5]" />
        </div>

        <span className="text-[12px] font-bold text-emerald-dark tracking-[0.2em] uppercase mb-2">
          Payment Received
        </span>

        {/* Large Amount Display */}
        <AmountDisplay 
          amount={lastPayment.amount} 
          size="display" 
          className="text-emerald font-extrabold text-center" 
        />

        <p className="text-midnight-60 font-semibold text-lg mt-4 leading-snug">
          from <span className="text-midnight font-bold">{lastPayment.senderName}</span>
        </p>

        {lastPayment.senderBank && (
          <p className="text-midnight-40 text-sm font-medium mt-1">
            via {lastPayment.senderBank}
          </p>
        )}

        <span className="text-midnight-40 text-xs font-semibold mt-6 bg-white/50 border border-gray-100 px-3 py-1 rounded-full">
          {timeStr}
        </span>
      </div>

      {/* Bottom Section: Dismiss CTA */}
      <div className="w-full max-w-sm pb-8">
        <button
          type="button"
          onClick={dismissConfirmation}
          className="w-full h-14 bg-emerald hover:bg-emerald-dark text-white font-bold text-base rounded-2xl transition-all shadow-cta select-none focus:outline-none focus:ring-4 focus:ring-emerald/30 active:scale-[0.98]"
        >
          Done
        </button>
      </div>
    </div>
  )
}
