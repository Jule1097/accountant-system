export function isError(value: unknown): value is Error {
  return typeof value === "object" && value !== null && "message" in value && typeof value.message === "string"
}

export function ensureError(value: unknown, fallbackMessage: string): Error {
  return isError(value) ? value : new Error(fallbackMessage)
}

export function isDate(value: unknown): value is Date {
  return typeof value === "object" && value !== null && Date.prototype.isPrototypeOf(value)
}
