import { cn } from '../../utils/cn'

interface StatusBadgeProps {
  status: 'successful' | 'pending' | 'failed'
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const configs = {
    successful: {
      bg: 'bg-emerald-50 text-emerald-dark',
      label: 'Successful',
    },
    pending: {
      bg: 'bg-amber/10 text-amber',
      label: 'Pending',
    },
    failed: {
      bg: 'bg-coral/10 text-coral',
      label: 'Failed',
    },
  }

  const current = configs[status] || configs.pending

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide capitalize",
        current.bg,
        className
      )}
    >
      {current.label}
    </span>
  )
}
