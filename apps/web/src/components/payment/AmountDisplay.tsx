import { cn } from '@/utils/cn'

interface AmountDisplayProps {
  amount: number
  size?: 'display' | 'display-sm'
  className?: string
}

export function AmountDisplay({ amount, size = 'display', className }: AmountDisplayProps) {
  // Format currency with ₦ (NGN) symbol, thousands separators, and 0 decimal places
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const formattedAmount = formatter.format(amount)

  return (
    <div
      className={cn(
        "font-bold tracking-tight text-midnight break-all w-full select-all",
        size === 'display' ? "text-display md:text-[72px]" : "text-display-sm md:text-[56px]",
        className
      )}
    >
      {formattedAmount}
    </div>
  )
}
