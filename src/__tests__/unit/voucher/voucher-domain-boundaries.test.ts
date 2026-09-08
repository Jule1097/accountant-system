import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const domainFiles = [
  "src/models/voucher/Voucher.ts",
  "src/models/voucher/Sale.ts",
  "src/models/voucher/Purchase.ts",
  "src/models/voucher/VoucherFactory.ts",
  "src/models/voucher/Money.ts",
  "src/models/voucher/ExchangeRate.ts",
  "src/types/voucher/domain.ts",
  "src/types/voucher/money.ts",
  "src/types/voucher/voucher-operations.ts",
  "src/lib/helpers/voucher/voucher-invariants.ts",
]

const forbiddenDomainDependencies = [
  /@prisma/,
  /Prisma\.Decimal/,
  /VoucherApiResponse/,
  /VoucherForm/,
  /ParsedVoucherData/,
  /VoucherSchemaOutput/,
  /from ["'][^"']*(parser|schemas|voucher-api|voucher-form)[^"']*["']/,
]

const removedLegacyVoucherFiles = ["src/models/Voucher.ts", "src/lib/schemas/voucher/voucher.ts"]

function readProjectFile(filePath: string): string {
  return readFileSync(join(process.cwd(), filePath), "utf8")
}

describe("voucher domain boundaries", () => {
  it("does not depend on persistence or external boundary representations", () => {
    const domainSource = domainFiles.map(readProjectFile).join("\n")

    for (const dependencyPattern of forbiddenDomainDependencies) expect(domainSource).not.toMatch(dependencyPattern)
  })

  it("does not import schema adapters into the domain factory", () => {
    expect(readProjectFile("src/models/voucher/VoucherFactory.ts")).not.toContain("voucher-factory-input")
  })

  it("does not keep removed duplicate voucher artifacts", () => {
    for (const filePath of removedLegacyVoucherFiles) expect(existsSync(join(process.cwd(), filePath))).toBe(false)
  })
})
