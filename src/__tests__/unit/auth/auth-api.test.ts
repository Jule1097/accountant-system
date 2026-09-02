import { NextRequest } from "next/server"
import { POST as login } from "src/app/api/auth/login/route"
import { POST as logout } from "src/app/api/auth/logout/route"
import { createRequestSupabaseClient } from "src/lib/integrations/supabase-server"
import { AuthSessionService } from "src/services/auth/AuthSession"

jest.mock("src/lib/integrations/supabase-server", () => ({
  createRequestSupabaseClient: jest.fn(() => ({
    auth: {},
  })),
}))

jest.mock("src/services/auth/AuthSession")

type AuthSessionServiceMock = jest.MockedClass<typeof AuthSessionService> & {
  prototype: {
    login: jest.Mock
    logout: jest.Mock
  }
}

function createRequest(overrides: Partial<NextRequest> = {}) {
  return {
    json: async () => ({}),
    cookies: {
      getAll: () => [],
      set: jest.fn(),
    },
    ...overrides,
  } as unknown as NextRequest
}

describe("Auth API Route Handlers", () => {
  const authSessionServiceMock = AuthSessionService as unknown as AuthSessionServiceMock
  const createRequestSupabaseClientMock = createRequestSupabaseClient as jest.MockedFunction<typeof createRequestSupabaseClient>

  beforeEach(() => {
    jest.clearAllMocks()
    createRequestSupabaseClientMock.mockReturnValue({
      auth: {},
    } as never)
  })

  it("returns the authenticated user DTO without token-bearing fields on login", async () => {
    authSessionServiceMock.prototype.login = jest.fn().mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
    })

    const response = await login(
      createRequest({
        json: async () => ({
          email: "user@example.com",
          password: "secret123",
        }),
      })
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toContain("no-store")
    expect(await response.json()).toEqual({
      user: {
        id: "user-1",
        email: "user@example.com",
      },
    })
  })

  it("returns 401 when login credentials are invalid", async () => {
    authSessionServiceMock.prototype.login = jest
      .fn()
      .mockRejectedValue(new Error("Credenciales inválidas. Por favor verifique e intente nuevamente."))

    const response = await login(
      createRequest({
        json: async () => ({
          email: "user@example.com",
          password: "wrong-password",
        }),
      })
    )

    expect(response.status).toBe(401)
    expect(response.headers.get("cache-control")).toContain("no-store")
    expect(await response.json()).toEqual({
      error: "Credenciales inválidas. Por favor verifique e intente nuevamente.",
    })
  })

  it("returns 200 and a token-free response body on logout", async () => {
    authSessionServiceMock.prototype.logout = jest.fn().mockResolvedValue(undefined)

    const response = await logout(createRequest())

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toContain("no-store")
    expect(await response.json()).toEqual({ success: true })
  })
})
