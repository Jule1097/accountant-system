import { NextResponse } from "next/server"
import { executeRequestWithContext } from "src/lib/helpers/api/request-handler"
import { RequestContextError } from "src/lib/errors/request-context"
import { requestContextErrorCodes } from "src/lib/constants/auth"

describe("request handler", () => {
  const request = new Request("http://localhost/api/resources")
  const context = { userId: "user-1", companyId: "company-1" }

  it("passes the validated context to the operation", async () => {
    const requireContext = jest.fn().mockResolvedValue(context)
    const operation = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const response = await executeRequestWithContext(request, operation, jest.fn(), requireContext)

    expect(response.status).toBe(200)
    expect(operation).toHaveBeenCalledWith(context)
  })

  it("maps context errors before invoking the operation", async () => {
    const requireContext = jest.fn().mockRejectedValue(new RequestContextError(requestContextErrorCodes.companyForbidden))
    const operation = jest.fn()
    const errorResolver = jest.fn()

    const response = await executeRequestWithContext(request, operation, errorResolver, requireContext)

    expect(response.status).toBe(403)
    expect(operation).not.toHaveBeenCalled()
    expect(errorResolver).not.toHaveBeenCalled()
  })

  it("delegates operation errors to the domain resolver", async () => {
    const operationError = new Error("operation failed")
    const operation = jest.fn().mockRejectedValue(operationError)
    const errorResponse = NextResponse.json({ error: "mapped" }, { status: 409 })
    const errorResolver = jest.fn().mockReturnValue(errorResponse)
    const requireContext = jest.fn().mockResolvedValue(context)

    await expect(executeRequestWithContext(request, operation, errorResolver, requireContext)).resolves.toBe(errorResponse)
    expect(errorResolver).toHaveBeenCalledWith(operationError)
  })

  it("preserves untyped operation failures for the error resolver", async () => {
    const operation = jest.fn().mockRejectedValue("unexpected failure")
    const errorResolver = jest.fn().mockReturnValue(NextResponse.json({ error: "mapped" }))
    const requireContext = jest.fn().mockResolvedValue(context)

    await executeRequestWithContext(request, operation, errorResolver, requireContext)

    expect(errorResolver).toHaveBeenCalledWith("unexpected failure")
  })
})
