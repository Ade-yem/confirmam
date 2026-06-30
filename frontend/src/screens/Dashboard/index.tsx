import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMerchantStore } from '../../store/merchantStore'
import { useTransactionStore } from '../../store/transactionStore'
import { MerchantHeader } from '../../components/dashboard/MerchantHeader'
import { TransactionCard } from '../../components/transaction/TransactionCard'
import { AmountDisplay } from '../../components/payment/AmountDisplay'
import { getTopCustomers, getWeeklyRevenue, getDashboardSummary } from '../../services/api'
import type { Customer, WeeklyBar } from '../../services/api/mocks/fixtures'
import type { DashboardSummary } from '../../types/merchant'
import { formatNaira } from '../../lib/formatters'
import { QrCode, Send, ArrowUpRight, TrendingUp, Users, ArrowLeftRight } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function DashboardScreen() {
  const navigate = useNavigate()
  const { merchant, todayRevenue, todayPaymentCount, isLoading: storeLoading } = useMerchantStore()
  const { transactions, isLoading: txLoading, fetchTransactions } = useTransactionStore()

  // Extended features local states
  const [topCustomers, setTopCustomers] = useState<Customer[]>([])
  const [weeklyRevenue, setWeeklyRevenue] = useState<WeeklyBar[]>([])
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null)
  const [loadingExtras, setLoadingExtras] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    // Fetch extended data for desktop layout or stats
    async function loadExtras() {
      setLoadingExtras(true)
      try {
        const [customers, weekly, summary] = await Promise.all([
          getTopCustomers(),
          getWeeklyRevenue(),
          getDashboardSummary()
        ])
        setTopCustomers(customers)
        setWeeklyRevenue(weekly)
        setDashboardSummary(summary)
      } catch (err) {
        console.error('Failed to load dashboard extras:', err)
      } finally {
        setLoadingExtras(false)
      }
    }
    loadExtras()
  }, [])

  const isLoading = storeLoading || txLoading || loadingExtras
  const maxWeeklyAmount = weeklyRevenue.length > 0 
    ? Math.max(...weeklyRevenue.map(d => d.amount)) 
    : 1

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* ================= COLUMN 1 ================= */}
        <div className="space-y-6">
          {/* Revenue Card (Dark styled) */}
          {isLoading ? (
            <div className="h-44 bg-gray-100 animate-pulse rounded-2xl" />
          ) : (
            <div className="p-6 bg-midnight text-white rounded-2xl shadow-soft relative overflow-hidden flex flex-col justify-between h-44">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-8 -mt-8" />
              <div>
                <span className="text-[10px] font-bold text-midnight-40 uppercase tracking-widest block">
                  TODAY'S REVENUE
                </span>
                <AmountDisplay 
                  amount={todayRevenue} 
                  size="display-sm" 
                  className="text-white font-extrabold mt-1" 
                />
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
              className="p-4 bg-white hover:bg-emerald-50 text-midnight hover:text-emerald-dark rounded-2xl border border-gray-100 shadow-card flex flex-col items-center justify-center gap-2 group transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald group-hover:bg-emerald group-hover:text-white flex items-center justify-center transition-colors">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Receive Payment</span>
            </button>
            
            <button
              onClick={() => navigate('/send')}
              className="p-4 bg-white hover:bg-emerald-50 text-midnight hover:text-emerald-dark rounded-2xl border border-gray-100 shadow-card flex flex-col items-center justify-center gap-2 group transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald group-hover:bg-emerald group-hover:text-white flex items-center justify-center transition-colors">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold">Send Money</span>
            </button>
          </div>

          {/* Mini Stats Card */}
          {isLoading ? (
            <div className="h-32 bg-gray-100 animate-pulse rounded-2xl" />
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card grid grid-cols-2 gap-4">
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

        {/* ================= COLUMN 2 (Center: Custom Weekly Chart & Top Customers) ================= */}
        <div className="space-y-6 md:col-span-1 lg:col-span-1">
          {/* Custom CSS Weekly Chart (Desktop/Tablet extension) */}
          {isLoading ? (
            <div className="h-56 bg-gray-100 animate-pulse rounded-2xl" />
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card flex flex-col justify-between min-h-56">
              <div>
                <h3 className="text-sm font-bold text-midnight tracking-tight">Weekly Performance</h3>
                <p className="text-[11px] font-semibold text-midnight-40">Naira volume by day</p>
              </div>

              {/* Pure CSS Bar Chart */}
              <div className="flex items-end justify-between gap-1.5 h-28 mt-4 px-2 select-none">
                {weeklyRevenue.map((dayData) => {
                  const relativeHeight = (dayData.amount / maxWeeklyAmount) * 100
                  return (
                    <div 
                      key={dayData.day} 
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative"
                    >
                      {/* CSS Tooltip on Hover */}
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-midnight text-white text-[9px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap mb-1 z-10 shadow-md">
                        {formatNaira(dayData.amount)}
                      </span>
                      {/* Bar fill */}
                      <div
                        style={{ height: `${relativeHeight}%` }}
                        className="w-full bg-emerald/15 group-hover:bg-emerald rounded-t-md transition-all duration-300 min-h-[4px]"
                      />
                      <span className="text-[10px] font-bold text-midnight-40">
                        {dayData.day}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Customers Panel (Desktop/Tablet extension) */}
          {isLoading ? (
            <div className="h-60 bg-gray-100 animate-pulse rounded-2xl" />
          ) : (
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card">
              <div className="flex items-center gap-1.5 mb-4">
                <Users className="w-4 h-4 text-emerald" />
                <h3 className="text-sm font-bold text-midnight tracking-tight">Top Customers</h3>
              </div>
              <div className="space-y-3">
                {topCustomers.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-xs font-bold text-midnight block">{c.name}</span>
                      <span className="text-[10px] font-semibold text-midnight-40 block mt-0.5">
                        {c.paymentCount} payments received
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald">
                      {formatNaira(c.totalSpent)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= COLUMN 3 (Right: Recent Activity) ================= */}
        <div className="md:col-span-2 lg:col-span-1 bg-white p-5 rounded-2xl border border-gray-100 shadow-card flex flex-col min-h-[400px]">
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
                    // Tap target built (MVP no-op but clickable)
                    console.log('Clicked transaction row:', tx.id)
                  }}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
