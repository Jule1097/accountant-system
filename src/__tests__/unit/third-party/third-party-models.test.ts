import { Client } from "src/models/third-party/Client"
import { Supplier } from "src/models/third-party/Supplier"
import { toClient, toSupplier, toThirdPartyView } from "src/lib/helpers/third-party/third-party-mapper"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const companyId = "company-1"
const createdAt = new Date("2026-08-25T00:00:00.000Z")
const updatedAt = new Date("2026-08-26T00:00:00.000Z")

describe("ThirdParty models", () => {
  it("normalizes shared identity values for a client", () => {
    const client = new Client({
      id: "client-1",
      companyId,
      name: "  Acme S.A.  ",
      cuit: "20-12345678-3",
    })

    expect(client.name).toBe("Acme S.A.")
    expect(client.cuit).toBe("20-12345678-3")
    expect(client.normalizedName).toBe("acme s.a.")
    expect(client.role).toBe("client")
  })

  it("applies the same identity behavior to a supplier", () => {
    const supplier = new Supplier({
      id: "supplier-1",
      companyId,
      name: "  Acme S.A.  ",
      cuit: "20123456783",
    })

    expect(supplier.name).toBe("Acme S.A.")
    expect(supplier.cuit).toBe("20-12345678-3")
    expect(supplier.matchesName("acme s.a.")).toBe(true)
    expect(supplier.matchesCuit("20-12345678-3")).toBe(true)
    expect(supplier.role).toBe("supplier")
  })

  it("changes name and cuit without leaving invalid state", () => {
    const client = new Client({ companyId, name: "Acme", cuit: "20-12345678-3" })

    client.rename("  New Name  ")
    client.changeCuit("20111111119")

    expect(client.name).toBe("New Name")
    expect(client.cuit).toBe("20-11111111-9")
  })

  it("rejects invalid intrinsic values", () => {
    expect(() => new Client({ companyId, name: "   ", cuit: "20-123" })).toThrow()
    expect(() => new Supplier({ companyId, name: "Supplier", cuit: "20-123" })).toThrow()
  })

  it("checks company ownership without infrastructure", () => {
    const supplier = new Supplier({ companyId, name: "Supplier", cuit: "20-12345678-3" })

    expect(supplier.belongsToCompany(companyId)).toBe(true)
    expect(supplier.belongsToCompany("company-2")).toBe(false)
  })

  it("maps persistence data to a role-specific domain model", () => {
    const client = toClient({
      id: "client-1",
      companyId,
      name: "Client",
      cuit: "20-12345678-3",
      createdAt,
      updatedAt,
    })

    const supplier = toSupplier({
      id: "supplier-1",
      companyId,
      name: "Supplier",
      cuit: "20-12345678-3",
      createdAt,
      updatedAt,
    })

    expect(client).toBeInstanceOf(Client)
    expect(supplier).toBeInstanceOf(Supplier)
    expect(client.role).toBe("client")
    expect(supplier.role).toBe("supplier")
  })

  it("maps an identified domain model to a stable view", () => {
    const client = new Client({
      id: "client-1",
      companyId,
      name: "Client",
      cuit: "20-12345678-3",
    })

    expect(toThirdPartyView(client, { id: "client-1", createdAt, updatedAt })).toEqual({
      id: "client-1",
      companyId,
      name: "Client",
      cuit: "20-12345678-3",
      role: "client",
      createdAt,
      updatedAt,
    })
  })

  it("keeps domain models independent from infrastructure", () => {
    const modelFiles = ["ThirdParty.ts", "Client.ts", "Supplier.ts"]
    const forbiddenImports = ["prisma", "repository", "api-client", "react", "toast", "client-supplier"]

    modelFiles.forEach((fileName) => {
      const source = readFileSync(join(process.cwd(), "src/models/third-party", fileName), "utf8").toLowerCase()

      forbiddenImports.forEach((forbiddenImport) => {
        expect(source).not.toContain(forbiddenImport)
      })
    })
  })
})
