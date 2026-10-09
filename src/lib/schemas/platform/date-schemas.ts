import { canonicalDateValidationMessage } from "src/lib/constants/date"
import { isCanonicalDate, parseCanonicalDate } from "src/lib/helpers/platform/canonical-date"
import { z } from "zod"

export function canonicalDateSchema(message = canonicalDateValidationMessage) {
  return z.string().refine(isCanonicalDate, message).transform((value) => {
    const parsedDate = parseCanonicalDate(value)
    if (!parsedDate) throw new Error(message)
    return parsedDate
  })
}

export function canonicalDateStringSchema(message = canonicalDateValidationMessage) {
  return z.string().refine(isCanonicalDate, message)
}

export function optionalCanonicalDateSchema(message = canonicalDateValidationMessage) {
  return canonicalDateSchema(message).optional()
}

export function nullableCanonicalDateSchema(message = canonicalDateValidationMessage) {
  return canonicalDateSchema(message).nullable().optional()
}
