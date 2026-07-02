import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMerchantStore } from '@/store/merchantStore'
import { useTransactionStore } from '@/store/transactionStore'
import { MerchantHeader } from '@/components/dashboard/MerchantHeader'
import { TransactionCard } from '@/components/transaction/TransactionCard'
import { AmountDisplay } from '@/components/payment/AmountDisplay'
import { ReceiptModal } from '@/components/payment/ReceiptModal'
import { getDashboardSummary } from '@/services/api'
import type { DashboardSummary } from '@/types/merchant'
import type { Transaction } from '@/types/transaction'
import { formatNaira } from '@/lib/formatters'
import { QrCode, Send, ArrowUpRight, TrendingUp, ArrowLeftRight, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function DashboardScreen() {
  const navigate = useNavigate()
  const { merchant, todayRevenue, todayPaymentCount, isLoading: storeLoading } = useMerchantStore()
  const { transactions, isLoading: txLoading, fetchTransactions } = useTransactionStore()

  // Extended features local states
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  // Persist show balance state in localStorage for better UX
  const [showBalance, setShowBalance] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('confirmam_show_balance')
      return saved !== 'false' // default to true
    }
    return true
  })

  const toggleBalance = () => {
    setShowBalance((prev) => {
      const next = !prev
      localStorage.setItem('confirmam_show_balance', String(next))
      return next
    })
  }

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    async function loadSummary() {
      setLoadingSummary(true)
      try {
        const summary = await getDashboardSummary()
        setDashboardSummary(summary)
      } catch (err) {
        console.error('Failed to load dashboard summary:', err)
      } finally {
        setLoadingSummary(false)
      }
    }
    loadSummary()
  }, [])

  const isLoading = storeLoading || txLoading || loadingSummary

  // Filter today's transactions for the mini recent feed
  const recentTransactions = transactions.slice(0, 5)

  // Quick stats values from local/fetched summary
  const averagePayment = dashboardSummary?.averagePayment || 17750
  const pendingAmount = dashboardSummary?.pendingAmount || 0

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Merchant profile header */}
      {merchant && <MerchantHeader merchant={merchant} />}

      {/* Main Responsive Grid:
          - Mobile: Single column
          - Tablet (md): 2 columns
          - Desktop (lg): 3 columns
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Summary and Actions */}
        <div className="space-y-6">
          {/* Revenue Card (Dark styled) */}
          {isLoading ? (
            <div className="h-44 bg-gray-100 animate-pulse rounded-2xl" />
          ) : (
            <div className="p-6 bg-midnight text-white rounded-2xl shadow-neu-flat-dark relative overflow-hidden flex flex-col justify-between h-44">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-midnight-40 uppercase tracking-widest block">
                    TODAY'S REVENUE
                  </span>
                  <button
                    type="button"
                    onClick={toggleBalance}
                    className="text-midnight-40 hover:text-white p-1 transition-colors outline-none focus:ring-2 focus:ring-emerald-50 rounded"
                    aria-label={showBalance ? "Hide balance" : "Show balance"}
                  >
                    {showBalance ? <EyeOff className="w-4 h-4 text-midnight-40 hover:text-white" /> : <Eye className="w-4 h-4 text-midnight-40 hover:text-white" />}
                  </button>
                </div>
                {showBalance ? (
                  <AmountDisplay 
                    amount={todayRevenue} 
                    size="display-sm" 
                    className="text-white font-extrabold mt-1" 
                  />
                ) : (
                  <div 
                    aria-label="Balance hidden" 
                    className="text-white font-extrabold text-[48px] leading-none mt-1 select-none font-mono"
                  >
                    ₦ ••••
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                <span className="text-xs font-semibold text-midnight-40">
                  {todayPaymentCount} payment{todayPaymentCount !== 1 ? 's' : ''} received
                </span>
                <TrendingUp className="w-4 h-4 text-lime" />
              </div>
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/receive')}
              className="p-4 bg-surface hover:bg-surface text-midnight rounded-2xl border border-white/60 shadow-neu-flat hover:shadow-neu-pressed active:shadow-neu-pressed flex flex-col items-center justify-center gap-2 group transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-surface shadow-neu-flat group-hover:shadow-neu-pressed group-active:shadow-neu-pressed text-emerald flex items-center justify-center transition-all">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Receive Payment</span>
            </button>
            
            <button
              onClick={() => navigate('/send')}
              className="p-4 bg-surface hover:bg-surface text-midnight rounded-2xl border border-white/60 shadow-neu-flat hover:shadow-neu-pressed active:shadow-neu-pressed flex flex-col items-center justify-center gap-2 group transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-surface shadow-neu-flat group-hover:shadow-neu-pressed group-active:shadow-neu-pressed text-emerald flex items-center justify-center transition-all">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Send Money</span>
            </button>
          </div>

          {/* Mini Stats Card */}
          {isLoading ? (
            <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
          ) : (
            <div className="bg-surface p-5 rounded-2xl border border-white/60 shadow-neu-flat grid grid-cols-2 gap-4">
              <div className="border-r border-gray-100 pr-2">
                <span className="text-[10px] font-bold text-midnight-40 uppercase tracking-wider block">
                  AVG PAYMENT
                </span>
                <span className="text-base font-bold text-midnight block mt-1">
                  {formatNaira(averagePayment)}
                </span>
              </div>
              <div className="pl-2">
                <span className="text-[10px] font-bold text-midnight-40 uppercase tracking-wider block">
                  PENDING SETTLEMENT
                </span>
                <span className={cn(
                  "text-base font-bold block mt-1",
                  pendingAmount > 0 ? "text-amber" : "text-midnight"
                )}>
                  {formatNaira(pendingAmount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity */}
        <div className="bg-surface p-5 rounded-2xl border border-white/60 shadow-neu-flat flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4 text-emerald" />
              <h3 className="text-sm font-bold text-midnight tracking-tight">Recent Activity</h3>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-bold text-emerald hover:text-emerald-dark hover:underline flex items-center gap-0.5"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Loading transactions states */}
          {isLoading ? (
            <div className="space-y-3 flex-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-100 rounded-xl">
              <span className="text-xs font-semibold text-midnight-40 mt-2 block">
                Ready to receive your first payment today.
              </span>
              <p className="text-[10px] font-semibold text-midnight-40 mt-0.5 max-w-[200px]">
                Generate a payment code to wait for transfers instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {recentTransactions.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onClick={() => {
                    setSelectedTx(tx)
                  }}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Sleek Receipt Modal Details Overlay */}
      <ReceiptModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
