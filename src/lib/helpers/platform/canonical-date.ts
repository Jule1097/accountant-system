import { canonicalDateMaximum, canonicalDateMinimum, canonicalDatePattern } from "src/lib/constants/date"

function isRealCalendarDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number)
  const parsedDate = new Date(Date.UTC(year, month - 1, day))
  return parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day
}

export function isCanonicalDate(value: unknown): value is string {
  return typeof value === "string" && canonicalDatePattern.test(value) && value >= canonicalDateMinimum && value <= canonicalDateMaximum && isRealCalendarDate(value)
}

export function isSupportedDomainDate(value: unknown): value is string {
  if (isCanonicalDate(value)) return true
  if (typeof value !== "string") return false
  const internalDateMatch = value.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/)
  return !!internalDateMatch && isCanonicalDate(internalDateMatch[1])
}

export function parseCanonicalDate(value: unknown): Date | null {
  return isCanonicalDate(value) ? new Date(`${value}T00:00:00.000Z`) : null
}

export function formatCanonicalDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}
