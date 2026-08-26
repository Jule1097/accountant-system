const cuitDigitsPattern = /^\d{11}$/

export function normalizeCuit(rawCuit: string): string {
  const digits = rawCuit.replace(/\D/g, '')

  if (!cuitDigitsPattern.test(digits)) {
    return rawCuit.trim()
  }

  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`
}

export function compareCuit(left: string, right: string): boolean {
  return left.replace(/\D/g, '') === right.replace(/\D/g, '')
}
