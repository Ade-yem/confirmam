import { useEffect, useState } from 'react'
import { useTransactionStore } from '@/store/transactionStore'
import { TransactionCard } from '@/components/transaction/TransactionCard'
import { ReceiptModal } from '@/components/payment/ReceiptModal'
import type { Transaction } from '@/types/transaction'
import { Search, History, ArrowLeftRight, Inbox } from 'lucide-react'
import { cn } from '@/utils/cn'

type FilterType = 'all' | 'incoming' | 'outgoing'

export default function TransactionsScreen() {
  const { transactions, isLoading, fetchTransactions } = useTransactionStore()
  
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Filter and search logic
  const filteredTransactions = transactions.filter((tx) => {
    // 1. Apply tab filter
    if (filter === 'incoming' && tx.direction !== 'incoming') return false
    if (filter === 'outgoing' && tx.direction !== 'outgoing') return false

    // 2. Apply search text query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      const sender = tx.senderName?.toLowerCase() || ''
      const recipient = tx.recipientName?.toLowerCase() || ''
      const bank = tx.recipientBank?.toLowerCase() || ''
      const ref = tx.reference.toLowerCase()
      const amount = tx.amount.toString()

      return (
        sender.includes(query) ||
        recipient.includes(query) ||
        bank.includes(query) ||
        ref.includes(query) ||
        amount.includes(query)
      )
    }

    return true
  })

  const hasTransactionsToday = transactions.length > 0

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl mx-auto min-h-[85vh] flex flex-col">
      {/* Screen Header */}
      <div className="flex items-center gap-3 select-none">
        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald flex items-center justify-center">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-midnight leading-tight">Transactions Ledger</h1>
          <p className="text-midnight-40 text-xs font-semibold">
            Chronological real-time transaction logs
          </p>
        </div>
      </div>

      {/* Search and Filters panel */}
      {hasTransactionsToday && (
        <div className="space-y-3.5 bg-white p-4 rounded-2xl border border-gray-100 shadow-card select-none">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-midnight-40 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, bank, or amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent placeholder-gray-300 transition-all"
            />
          </div>

          {/* Direction filters */}
          <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
            {(['all', 'incoming', 'outgoing'] as FilterType[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  "flex-1 py-2 text-xs font-bold rounded-lg capitalize select-none transition-all",
                  filter === tab
                    ? "bg-white text-emerald shadow-sm border border-gray-100"
                    : "text-midnight-60 hover:text-midnight hover:bg-gray-100/50"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Transactions List */}
      <div className="flex-1 flex flex-col">
        {isLoading ? (
          /* Pulse skeletons loading state */
          <div className="space-y-3.5 flex-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : !hasTransactionsToday ? (
          /* Empty state: No transactions at all for today */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-100 bg-white rounded-2xl shadow-card my-auto min-h-[300px]">
            <div className="w-14 h-14 bg-emerald-50 text-emerald rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-midnight">No Payments Yet</h3>
            <p className="text-xs text-midnight-40 font-medium max-w-[260px] mx-auto mt-2 leading-relaxed">
              No payments yet today. Your next payment will appear here instantly.
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          /* Empty state: Search queries matched nothing */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-100 bg-white rounded-2xl shadow-card my-auto min-h-[300px]">
            <div className="w-14 h-14 bg-coral/5 text-coral rounded-full flex items-center justify-center mb-4">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-midnight">No Results Found</h3>
            <p className="text-xs text-midnight-40 font-medium max-w-[260px] mx-auto mt-2 leading-relaxed">
              No transactions match this search. Try refining your keywords.
            </p>
          </div>
        ) : (
          /* Loaded transaction cards list */
          <div className="space-y-3.5 flex-1 pb-6">
            {filteredTransactions.map((tx) => (
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

      {/* Sleek Receipt Modal Details Overlay */}
      <ReceiptModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />
    </div>
  )
}
