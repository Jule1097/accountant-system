import { readFileSync } from "node:fs"
import { join } from "node:path"

const files = {
  managementHelper: "src/lib/helpers/voucher/voucher-management.ts",
  platformFormatting: "src/lib/helpers/platform/formatting.ts",
  formHelper: "src/lib/helpers/voucher/voucher-form.ts",
  formHook: "src/hooks/voucher/use-voucher-form.ts",
  exportHook: "src/hooks/voucher/use-voucher-export.ts",
  formOptionsHook: "src/hooks/voucher/use-voucher-form-options.ts",
  inlineThirdPartyHook: "src/hooks/voucher/use-voucher-inline-third-party.ts",
  voucherDataHook: "src/hooks/voucher/use-vouchers.ts",
  managementHook: "src/hooks/voucher/use-voucher-management.ts",
  voucherTypes: "src/types/voucher/voucher.ts",
  domainTypes: "src/types/voucher/domain.ts",
  domainDateTypes: "src/types/voucher/domain-date.ts",
}

function readProjectFile(filePath: string): string {
  return readFileSync(join(process.cwd(), filePath), "utf8")
}

describe("voucher cleanup architecture", () => {
  it("reuses shared formatting and type conversion helpers", () => {
    const managementHelper = readProjectFile(files.managementHelper)
    const platformFormatting = readProjectFile(files.platformFormatting)

    expect(managementHelper).not.toContain("function getVoucherFormattedAmount")
    expect(managementHelper).not.toContain("function getVoucherFormattedDate")
    expect(platformFormatting).toContain("getFormattedAmount")
    expect(platformFormatting).toContain("getFormattedDate")
    expect(readProjectFile(files.formHelper)).not.toContain("function resolveVoucherApiType")
    expect(readProjectFile(files.formHook)).not.toContain("function resolveVoucherKind")
    expect(readProjectFile(files.exportHook)).not.toContain('const apiType = type === "sales"')
  })

  it("uses one shared response parser for voucher hooks", () => {
    expect(readProjectFile(files.formOptionsHook)).not.toContain("function parseResponseJson")
    expect(readProjectFile(files.formHook)).not.toContain("function parseResponseJson")
    expect(readProjectFile(files.inlineThirdPartyHook)).not.toContain("function parseResponseJson")
  })

  it("uses generic resource and mutation hooks for voucher data management", () => {
    expect(readProjectFile(files.voucherDataHook)).not.toContain("useSWR")
    expect(readProjectFile(files.managementHook)).not.toContain("apiRequest")
    expect(readProjectFile(files.managementHook)).toContain("useResourceMutation")
    expect(readProjectFile(files.managementHook)).toContain("useResourceDeletionCoordinator")
  })

  it("does not keep an unused query builder parameter", () => {
    expect(readProjectFile(files.managementHelper)).not.toContain("void searchParams")
  })

  it("does not keep confirmed dead voucher type declarations", () => {
    expect(readProjectFile(files.voucherTypes)).not.toContain("interface VoucherRetention")
    expect(readProjectFile(files.voucherTypes)).not.toContain("interface VoucherPerception")
    expect(readProjectFile(files.voucherTypes)).not.toContain("interface VoucherCollectionKey")
    expect(readProjectFile(files.domainTypes)).not.toContain("VoucherDomainType")
    expect(readProjectFile(files.domainDateTypes)).not.toContain("DomainDateParts")
  })
})
