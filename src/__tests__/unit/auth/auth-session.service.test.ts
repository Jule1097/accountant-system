import { AuthSessionService } from "src/services/auth/auth-session.service"

describe("AuthSessionService", () => {
  const signInWithPassword = jest.fn()
  const signOut = jest.fn()
  const service = new AuthSessionService()
  const supabase = {
    auth: {
      signInWithPassword,
      signOut,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns only the authenticated user DTO on login", async () => {
    signInWithPassword.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
          aud: "authenticated",
        },
        session: {
          access_token: "secret-token",
          refresh_token: "refresh-token",
        },
      },
      error: null,
    })

    await expect(
      service.login(supabase as never, {
        email: "user@example.com",
        password: "secret123",
      })
    ).resolves.toEqual({
      id: "user-1",
      email: "user@example.com",
    })
  })

  it("throws a user-facing invalid credentials error when auth fails", async () => {
    signInWithPassword.mockResolvedValue({
      data: {
        user: null,
        session: null,
      },
      error: {
        message: "Invalid login credentials",
      },
    })

    await expect(
      service.login(supabase as never, {
        email: "user@example.com",
        password: "wrong-password",
      })
    ).rejects.toThrow("Credenciales inválidas. Por favor verifique e intente nuevamente.")
  })

  it("delegates logout to supabase auth", async () => {
    signOut.mockResolvedValue({ error: null })

    await expect(service.logout(supabase as never)).resolves.toBeUndefined()
    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
