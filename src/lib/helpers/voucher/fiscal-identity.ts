import { databaseErrorCodes } from "src/lib/constants/database"
import { voucherFiscalIdentityConstraintNames, voucherFiscalIdentityFieldSets } from "src/lib/constants/voucher"
import { isError } from "src/lib/helpers/shared/type-guards"

function getConstraintTarget(error: object): string {
  if (!("meta" in error) || !error.meta || typeof error.meta !== "object") {
    return ""
  }

  if (!("target" in error.meta)) {
    return ""
  }

  const target = error.meta.target
  return Array.isArray(target) ? target.join(",") : typeof target === "string" ? target : ""
}

export function isFiscalVoucherIdentityConstraintError(error: unknown): boolean {
  if (!isError(error) || !("code" in error) || error.code !== databaseErrorCodes.uniqueViolation) {
    return false
  }

  const target = getConstraintTarget(error)
  return [voucherFiscalIdentityConstraintNames.sale, voucherFiscalIdentityConstraintNames.purchase].some((constraintName) => error.message.includes(constraintName) || target.includes(constraintName)) || voucherFiscalIdentityFieldSets.some((fieldSet) => fieldSet.every((field) => target.includes(field)))
}
