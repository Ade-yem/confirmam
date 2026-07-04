import { useState, useEffect } from 'react'
import { getBanks, resolveAccountName, sendMoney } from '@/services/api'
import type { Bank, TransferResult, Transaction } from '@/types/transaction'
import { useTransactionStore } from '@/store/transactionStore'
import { formatNaira, formatAccountNumber } from '@/lib/formatters'
import { Search, Loader2, Check, AlertCircle, ArrowLeft, ArrowRight, Delete } from 'lucide-react'
import { cn } from '@/utils/cn'

type Step = 'bank' | 'account' | 'resolve' | 'amount' | 'confirm' | 'result'

export function TransferForm() {
  const [step, setStep] = useState<Step>('bank')
  
  const { prependTransaction } = useTransactionStore()
  
  // Form fields
  const [banks, setBanks] = useState<Bank[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null)
  const [accountNumber, setAccountNumber] = useState('')
  const [lastVerifiedNumber, setLastVerifiedNumber] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [amount, setAmount] = useState<number>(0)
  
  // Status states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null)

  // Fetch banks on mount
  useEffect(() => {
    async function loadBanks() {
      try {
        setError(null)
        const banksList = await getBanks()
        setBanks(banksList)
      } catch (err: any) {
        console.error('Failed to load banks:', err)
        setError(err.message || 'Failed to load bank list. Please try again.')
      }
    }
    loadBanks()
  }, [])

  const handleResolve = async () => {
    if (!selectedBank || accountNumber.length !== 10) return
    
    setLastVerifiedNumber(accountNumber)
    setStep('resolve')
    setLoading(true)
    setError(null)
    setResolvedName('')

    try {
      const response = await resolveAccountName(selectedBank.code, accountNumber)
      setResolvedName(response.name)
      // Transition to amount input
      setTimeout(() => {
        setStep('amount')
        setLoading(false)
      }, 1000) // Keep the resolution visible momentarily for visual feedback
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Unable to verify this account. Check the number and try again.')
      setLoading(false)
    }
  }

  // Auto-advance to name resolution when 10 digits are typed in Step 2
  useEffect(() => {
    if (
      step === 'account' && 
      accountNumber.length === 10 && 
      selectedBank && 
      accountNumber !== lastVerifiedNumber
    ) {
      handleResolve()
    }
  }, [accountNumber, selectedBank, step, lastVerifiedNumber])

  const handleSend = async () => {
    if (!selectedBank || !resolvedName || amount <= 0) return
    
    setLoading(true)
    setError(null)

    try {
      const payload = {
        recipientBank: selectedBank.name,
        recipientAccountNumber: accountNumber,
        recipientName: resolvedName,
        amount,
      }
      const response = await sendMoney(payload)
      
      // Construct a new outgoing Transaction object to update ledger list
      const newTx: Transaction = {
        id: response.reference, // Use reference as temp ID
        direction: 'outgoing',
        amount: amount,
        recipientName: resolvedName,
        recipientBank: selectedBank.name,
        timestamp: response.timestamp,
        status: response.status,
        reference: response.reference,
      }
      prependTransaction(newTx)
      
      setTransferResult(response)
      setStep('result')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Transfer failed. Please check details and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setStep('bank')
    setSelectedBank(null)
    setAccountNumber('')
    setLastVerifiedNumber('')
    setResolvedName('')
    setAmount(0)
    setError(null)
    setTransferResult(null)
  }

  // Filtered banks list based on search query
  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Custom Numpad keys for Amount Entry
  const handleNumpadTap = (key: string) => {
    if (key === 'backspace') {
      setAmount((prev) => {
        const valStr = prev.toString()
        if (valStr.length <= 1) return 0
        return Number(valStr.slice(0, -1))
      })
    } else {
      setAmount((prev) => {
        const currentStr = prev === 0 ? '' : prev.toString()
        const nextStr = currentStr + key
        // Prevent exceeding sensible transaction limits
        if (Number(nextStr) > 5000000) return prev
        return Number(nextStr)
      })
    }
  }

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-soft p-5 max-w-lg mx-auto relative min-h-[460px] flex flex-col justify-between">
      
      {/* Wizard Header (Except for Result step) */}
      {step !== 'result' && (
        <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4 select-none">
          <div className="flex items-center gap-2">
            {step !== 'bank' && (
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  if (step === 'account') setStep('bank')
                  else if (step === 'resolve') setStep('account')
                  else if (step === 'amount') setStep('account')
                  else if (step === 'confirm') setStep('amount')
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center text-midnight transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <span className="text-[10px] font-bold text-midnight-40 uppercase tracking-widest block">
                SEND MONEY
              </span>
              <h2 className="text-sm font-bold text-midnight leading-tight capitalize">
                {step === 'bank' && 'Select Recipient Bank'}
                {step === 'account' && 'Enter Account Number'}
                {step === 'resolve' && 'Verifying Account...'}
                {step === 'amount' && 'Enter Amount'}
                {step === 'confirm' && 'Confirm Transaction'}
              </h2>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
            {step === 'bank' && 'Step 1/5'}
            {step === 'account' && 'Step 2/5'}
            {step === 'resolve' && 'Step 3/5'}
            {step === 'amount' && 'Step 4/5'}
            {step === 'confirm' && 'Step 5/5'}
          </span>
        </div>
      )}

      {/* Recipient summary banner (displayed above content in steps 3, 4, 5) */}
      {['resolve', 'amount', 'confirm'].includes(step) && selectedBank && (
        <div className="bg-emerald-50/50 border border-emerald-100/50 p-3 rounded-xl flex items-center justify-between mb-4 text-xs select-none">
          <div>
            <span className="text-midnight-40 text-[9px] font-bold uppercase tracking-wider block">RECIPIENT</span>
            <span className="font-bold text-midnight block">
              {resolvedName || 'Resolving name...'}
            </span>
            <span className="text-[10px] font-semibold text-midnight-60 mt-0.5 block">
              {selectedBank.name} • {formatAccountNumber(accountNumber)}
            </span>
          </div>
          {step === 'amount' && (
            <button
              onClick={() => setStep('account')}
              className="text-xs font-bold text-emerald hover:underline hover:text-emerald-dark"
            >
              Change
            </button>
          )}
        </div>
      )}

      {/* WIZARD CONTENT SECTIONS */}
      <div className="flex-1 flex flex-col justify-center">
        
        {/* STEP 1: Bank Selection */}
        {step === 'bank' && (
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="relative">
              <Search className="w-4 h-4 text-midnight-40 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search bank name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-9 pr-4 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent placeholder-gray-300 transition-all"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[260px] space-y-1 pr-1">
              {filteredBanks.length === 0 ? (
                <div className="text-center py-6 text-xs text-midnight-40 font-semibold">
                  No banks match your search.
                </div>
              ) : (
                filteredBanks.map((bank) => (
                  <button
                    key={bank.code}
                    onClick={() => {
                      setSelectedBank(bank)
                      setStep('account')
                    }}
                    className="w-full text-left px-3 py-3 hover:bg-gray-50 rounded-xl flex items-center justify-between group transition-colors"
                  >
                    <span className="text-xs font-bold text-midnight group-hover:text-emerald transition-colors">
                      {bank.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-midnight-40 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Account Number */}
        {step === 'account' && selectedBank && (
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100/50 flex justify-between items-center text-xs">
              <div>
                <span className="text-midnight-40 text-[9px] font-bold uppercase tracking-wider block">SELECTED BANK</span>
                <span className="font-bold text-midnight block mt-0.5">{selectedBank.name}</span>
              </div>
              <button
                onClick={() => setStep('bank')}
                className="text-xs font-bold text-emerald hover:underline hover:text-emerald-dark"
              >
                Change Bank
              </button>
            </div>

            <div className="space-y-1">
              <label htmlFor="accountNumber" className="text-xs font-bold text-midnight-60 uppercase tracking-wider block">
                Account Number
              </label>
              <input
                id="accountNumber"
                type="text"
                pattern="[0-9]*"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter 10-digit account number"
                value={accountNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '')
                  setAccountNumber(cleaned)
                  setError(null)
                }}
                className="w-full h-14 px-4 text-lg font-bold tracking-widest text-midnight border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald focus:border-transparent placeholder-gray-300 transition-all font-mono"
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3 bg-coral/10 text-coral text-xs font-semibold rounded-xl border border-coral/10">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Auto Name Resolution */}
        {step === 'resolve' && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            {loading ? (
              <div className="space-y-4 flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-emerald animate-spin" />
                <div>
                  <span className="text-xs font-bold text-midnight block">Resolving Account Details</span>
                  <span className="text-[10px] font-semibold text-midnight-40 block mt-1">
                    Verifying name on database...
                  </span>
                </div>
                {/* Skeleton Loader placeholder */}
                <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mt-4" />
              </div>
            ) : error ? (
              <div className="space-y-4 w-full px-4">
                <div className="w-12 h-12 bg-coral/10 rounded-full flex items-center justify-center text-coral mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-midnight">Resolution Failed</h3>
                  <p className="text-xs text-coral font-medium mt-1.5">{error}</p>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep('account')}
                    className="flex-1 h-12 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-midnight text-xs font-bold rounded-xl transition-all"
                  >
                    Edit Account
                  </button>
                  <button
                    onClick={() => handleResolve()}
                    className="flex-1 h-12 bg-emerald hover:bg-emerald-dark text-white text-xs font-bold rounded-xl transition-all shadow-md"
                  >
                    Retry Verify
                  </button>
                </div>
              </div>
            ) : (
              // Name resolved visually before advance
              <div className="space-y-2">
                <div className="w-10 h-10 bg-emerald-50 text-emerald rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <Check className="w-5 h-5 stroke-3" />
                </div>
                <span className="text-[10px] font-bold text-emerald uppercase tracking-wider block">
                  Account Verified
                </span>
                <h3 className="text-xl font-extrabold text-midnight tracking-tight max-w-[280px] mx-auto wrap-break-word leading-tight">
                  {resolvedName}
                </h3>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Enter Amount */}
        {step === 'amount' && (
          <div className="flex flex-col items-stretch space-y-4">
            <div className="text-center py-2 select-all">
              <span className="text-[10px] font-bold text-midnight-40 uppercase tracking-widest block">ENTER AMOUNT</span>
              <div className="text-display font-extrabold text-midnight mt-1 select-all">
                {formatNaira(amount)}
              </div>
            </div>

            {/* Mobile Numpad Component */}
            <div className="grid grid-cols-3 gap-2 py-2 max-w-sm mx-auto w-full select-none">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'backspace'].map((key) => {
                const isBack = key === 'backspace'
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumpadTap(key)}
                    className={cn(
                      "h-12 bg-gray-50 active:bg-gray-200 border border-gray-100 text-midnight font-bold rounded-xl flex items-center justify-center transition-all",
                      isBack ? "text-coral bg-coral/5 hover:bg-coral/10" : "text-sm"
                    )}
                  >
                    {isBack ? <Delete className="w-5 h-5" /> : key}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setStep('confirm')}
              disabled={amount <= 0}
              className="w-full h-12 bg-emerald hover:bg-emerald-dark disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none text-white font-bold text-sm rounded-xl transition-all shadow-md select-none mt-2"
            >
              Continue to Confirm
            </button>
          </div>
        )}

        {/* STEP 5: Confirm Summary */}
        {step === 'confirm' && selectedBank && (
          <div className="space-y-5 py-2">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3.5 select-none">
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-midnight-40 font-bold uppercase tracking-wider">RECIPIENT</span>
                <span className="font-bold text-midnight text-right">{resolvedName}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-midnight-40 font-bold uppercase tracking-wider">BANK NAME</span>
                <span className="font-bold text-midnight text-right">{selectedBank.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1 border-b border-gray-100">
                <span className="text-midnight-40 font-bold uppercase tracking-wider">ACCOUNT NUMBER</span>
                <span className="font-bold text-midnight text-right font-mono">{accountNumber}</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <span className="text-midnight-40 font-bold uppercase tracking-wider">TRANSFER AMOUNT</span>
                <span className="font-extrabold text-emerald text-sm text-right">{formatNaira(amount)}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-coral/10 text-coral text-xs font-semibold rounded-xl border border-coral/10">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="flex-1 h-13 border border-gray-200 hover:bg-gray-50 text-midnight text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="flex-1 h-13 bg-emerald hover:bg-emerald-dark text-white text-xs font-bold rounded-xl transition-all shadow-cta flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Send {formatNaira(amount)}</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Result Success/Failed screen */}
        {step === 'result' && transferResult && selectedBank && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-emerald text-white rounded-full flex items-center justify-center shadow-cta animate-spring-in">
              <Check className="w-8 h-8 stroke-3" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-emerald uppercase tracking-widest block">
                Transfer Successful
              </span>
              <div className="text-display font-extrabold text-midnight mt-1 select-all">
                {formatNaira(amount)}
              </div>
            </div>

            <div className="max-w-xs w-full bg-gray-50 rounded-xl p-3 border border-gray-100 text-left text-xs space-y-2 font-medium text-midnight-60 select-all">
              <p>Sent to <span className="font-bold text-midnight">{resolvedName}</span></p>
              <p>{selectedBank.name} • {accountNumber}</p>
              <p className="text-[10px] text-midnight-40 mt-2 font-mono">Ref: {transferResult.reference}</p>
            </div>

            <button
              onClick={handleReset}
              className="w-full max-w-xs h-12 bg-emerald hover:bg-emerald-dark text-white font-bold text-sm rounded-xl transition-all shadow-md"
            >
              Start New Transfer
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
