import { NextRequest } from "next/server"
import { POST as discardItems } from "src/app/api/conciliations/items/discard/route"
import { POST as persistItems } from "src/app/api/conciliations/items/persist/route"
import { ConciliationsService } from "src/services/conciliation/Conciliations"
import { VoucherPersistenceService } from "src/services/parser/VoucherPersistence"

jest.mock("src/services/conciliation/Conciliations")
jest.mock("src/services/parser/VoucherPersistence")
jest.mock("src/lib/helpers/auth/request-context", () => ({
  requireRequestContext: jest.fn(async () => ({ userId: "user-1", companyId: "company-1" })),
}))

function createRequest(json: () => Promise<unknown>): NextRequest {
  const request = new NextRequest("http://localhost/api/conciliations/items", { headers: { "x-company-id": "company-1" } })
  Object.defineProperty(request, "json", { value: json, writable: true })
  return request
}

describe("conciliation API error responses", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns a controlled response when bulk discard JSON is malformed", async () => {
    const response = await discardItems(createRequest(async () => { throw new SyntaxError("Unexpected token") }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "El cuerpo de la solicitud es inv\u00e1lido." })
    expect(ConciliationsService.prototype.discardItems).not.toHaveBeenCalled()
  })

  it("returns a controlled response when bulk persist JSON is malformed", async () => {
    const response = await persistItems(createRequest(async () => { throw new SyntaxError("Unexpected token") }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "El cuerpo de la solicitud es inv\u00e1lido." })
    expect(VoucherPersistenceService.prototype.enqueueItems).not.toHaveBeenCalled()
  })
})
