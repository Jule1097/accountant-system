import { authLoginSchema } from "src/lib/schemas/auth/auth-schemas"

describe("Auth schemas", () => {
  it("accepts valid login credentials", () => {
    const result = authLoginSchema.safeParse({
      email: "user@example.com",
      password: "secret123",
    })

    expect(result.success).toBe(true)
  })

  it("rejects invalid login credentials", () => {
    expect(
      authLoginSchema.safeParse({
        email: "invalid-email",
        password: "123",
      }).success
    ).toBe(false)
  })
})
