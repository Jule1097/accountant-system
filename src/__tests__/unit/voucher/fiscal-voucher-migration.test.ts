import { readFileSync } from "node:fs"
import { join } from "node:path"

const migrationPath = join(process.cwd(), "prisma", "migrations", "20260923120000_protect_concurrent_fiscal_voucher_persistence", "migration.sql")

describe("Fiscal voucher uniqueness migration", () => {
  it("preflights historical fiscal duplicate groups before creating named uniqueness indexes", () => {
    const migration = readFileSync(migrationPath, "utf8")

    expect(migration).toContain("voucher_fiscal_sale_identity_unique")
    expect(migration).toContain("voucher_fiscal_purchase_identity_unique")
    expect(migration).toContain('documentIdentificationMode" = \'fiscal\'')
    expect(migration).toContain("RAISE EXCEPTION")
    expect(migration).toContain("NULLS NOT DISTINCT")
    expect(migration).not.toMatch(/(DELETE|UPDATE)\s+FROM\s+"voucher"/i)
  })
})
