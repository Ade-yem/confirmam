/**
 * Formats a number to Nigerian Naira (₦) representation.
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats a 10-digit Nigerian account number into spaced groups of 4-3-3 for readability:
 * e.g., "8123456790" -> "8123 4567 90" or "8123 4567 890" (if 10/11 digits)
 */
export function formatAccountNumber(accountNumber: string): string {
  const clean = accountNumber.replace(/\s+/g, '')
  if (clean.length === 10) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`
  }
  if (clean.length === 11) {
    return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8)}`
  }
  // Fallback if not standard length
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * Formats an ISO date string into a user-friendly time string (e.g., "2:35 PM").
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  } catch (err) {
    return ''
  }
}

/**
 * Formats an ISO date string into a readable date string (e.g., "Jun 30, 2026").
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return ''
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch (err) {
    return ''
  }
}
