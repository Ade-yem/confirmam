import { useMerchantStore } from '@/store/merchantStore'
import { useVoice } from '../../hooks/useVoice'
import { formatAccountNumber } from '@/lib/formatters'
import { User, Shield, Phone, MapPin, Volume2, Building2 } from 'lucide-react'

export default function ProfileScreen() {
  const { merchant, isLoading } = useMerchantStore()
  const { speak } = useVoice()

  const handleTestVoice = () => {
    speak('Payment received from test customer.')
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-xl mx-auto space-y-6 animate-pulse select-none">
        {/* Screen Header Skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-3 w-48 bg-gray-100/60 rounded" />
          </div>
        </div>

        {/* Profile Card Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
            <div className="w-14 h-14 rounded-full bg-gray-100" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-gray-100 rounded" />
              <div className="h-3 w-24 bg-gray-100/60 rounded" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-40 bg-gray-100 rounded" />
            <div className="h-3 w-36 bg-gray-100 rounded" />
            <div className="h-3 w-48 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Bank Details Card Skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="h-3 w-28 bg-gray-100 rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-2 w-12 bg-gray-100/60 rounded" />
              <div className="h-3.5 w-24 bg-gray-100 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-2 w-16 bg-gray-100/60 rounded" />
              <div className="h-3.5 w-28 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-xl mx-auto text-center py-12">
        <p className="text-sm font-semibold text-midnight-60">Merchant details not loaded.</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-xl mx-auto space-y-6">
      {/* Screen Header */}
      <div className="flex items-center gap-3 select-none">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald flex items-center justify-center">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-midnight leading-tight">Merchant Settings</h1>
          <p className="text-midnight-40 text-xs font-semibold">
            Manage your terminal configuration
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
        <div className="flex items-center gap-4 border-b border-gray-50 pb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald flex items-center justify-center font-bold text-lg">
            {merchant.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-bold text-midnight leading-tight">{merchant.name}</h3>
            <span className="text-xs font-semibold text-midnight-40 mt-1 block">ID: {merchant.id}</span>
          </div>
        </div>

        <div className="space-y-3.5 text-xs text-midnight-60 font-semibold select-none">
          {merchant.location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-midnight-40" />
              <span>{merchant.location}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-midnight-40" />
            <span>+234 812 345 6790</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-midnight-40" />
            <span>Terminal Security: Active</span>
          </div>
        </div>
      </div>

      {/* Recipient Account Details Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-3 select-none">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-emerald" />
          <h3 className="text-xs font-bold text-midnight uppercase tracking-wider">Settlement Bank Details</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
          <div>
            <span className="text-midnight-40 text-[10px] uppercase block">Bank Name</span>
            <span className="text-midnight block mt-1">{merchant.bankName}</span>
          </div>
          <div>
            <span className="text-midnight-40 text-[10px] uppercase block">Account Number</span>
            <span className="text-midnight block mt-1 font-mono">{formatAccountNumber(merchant.virtualAccountNumber)}</span>
          </div>
        </div>
      </div>

      {/* Voice Configuration & Testing */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-emerald" />
          <h3 className="text-xs font-bold text-midnight uppercase tracking-wider">Voice Alerts</h3>
        </div>
        
        <p className="text-xs text-midnight-60 font-medium leading-relaxed select-none">
          Your payment terminal reads aloud transaction alerts to let you confirm payments even when you're not using your phone.
        </p>

        <button
          type="button"
          onClick={handleTestVoice}
          className="w-full h-11 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200 text-midnight text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Volume2 className="w-4 h-4 text-emerald" />
          <span>Test Voice Output</span>
        </button>
      </div>

      {/* Version badge */}
      <div className="text-center text-[10px] font-bold text-midnight-40 uppercase tracking-widest pt-4 select-none">
        ConfirmAm Terminal v1.0.0
      </div>
    </div>
  )
}
