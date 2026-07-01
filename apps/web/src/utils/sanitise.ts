// utils/sanitise.ts
export function sanitiseText(value: string): string {
  return value
    .trim()
    .replace(/[<>"'`]/g, '')   // Strip characters with no legitimate use in these fields
}

export function sanitiseEmail(value: string): string {
  return sanitiseText(value).toLowerCase()
}
