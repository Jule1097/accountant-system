import { compareCuit } from "src/lib/domain/cuit"
import { normalizeClientSupplierName } from "src/lib/helpers/client-supplier/client-supplier"
import { ClientSupplierFormValues, ClientSupplierModalInitialValues, ClientSupplierRecord } from "src/types/client-supplier/client-supplier"
import { VoucherScreenType } from "src/types/voucher/voucher"
import { VoucherParsedData, VoucherThirdPartyOption } from "src/types/voucher/voucher-form"

export function resolveVoucherThirdPartyEndpoint(type: VoucherScreenType): string {
  if (type === "sales") {
    return "/api/clients"
  }

  return "/api/suppliers"
}

export function resolveVoucherThirdPartyModalType(type: VoucherScreenType): "clients" | "suppliers" {
  if (type === "sales") {
    return "clients"
  }

  return "suppliers"
}

export function resolveVoucherInlineInitialValues(
  parsedData: VoucherParsedData | null | undefined,
  selectedThirdParty: VoucherThirdPartyOption | undefined
): ClientSupplierModalInitialValues {
  return {
    name: parsedData?.thirdPartyName || selectedThirdParty?.name || "",
    cuit: parsedData?.thirdPartyCuit || selectedThirdParty?.cuit || "",
  }
}

export function shouldShowVoucherInlineThirdPartyAction(
  parsedData: VoucherParsedData | null | undefined,
  selectedThirdParty: VoucherThirdPartyOption | undefined
): boolean {
  if (selectedThirdParty) {
    return false
  }

  return Boolean(parsedData?.thirdPartyName?.trim() || parsedData?.thirdPartyCuit?.trim())
}

export function toVoucherThirdPartyOption(record: ClientSupplierRecord): VoucherThirdPartyOption {
  return {
    id: record.id,
    name: record.name,
    cuit: record.cuit,
  }
}

export function mergeVoucherThirdPartyOptions(
  options: VoucherThirdPartyOption[],
  record: ClientSupplierRecord
): VoucherThirdPartyOption[] {
  const nextOption = toVoucherThirdPartyOption(record)
  const existingOption = options.find((option) => option.id === nextOption.id)

  if (existingOption) {
    return options.map((option) => option.id === nextOption.id ? nextOption : option)
  }

  return [...options, nextOption]
}

export function resolveMatchingVoucherThirdPartyRecord(
  records: ClientSupplierRecord[],
  values: ClientSupplierFormValues
): ClientSupplierRecord | null {
  const normalizedName = normalizeClientSupplierName(values.name)
  const exactMatches = records.filter((record) => {
    const sameCuit = values.cuit ? compareCuit(record.cuit, values.cuit) : false
    const sameName = values.name ? normalizeClientSupplierName(record.name) === normalizedName : false

    if (values.name && values.cuit) {
      return sameCuit && sameName
    }

    return sameCuit || sameName
  })

  if (exactMatches.length !== 1) {
    return null
  }

  return exactMatches[0]
}
