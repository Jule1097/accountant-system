import { proxy } from "src/proxy"

const incrMock = jest.fn().mockResolvedValue(1)
const expireMock = jest.fn()

jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({ incr: incrMock, expire: expireMock })),
}))

function createRequest(method = "GET", headers: Record<string, string> = {}) {
  return {
    method,
    url: "http://localhost/api/vouchers",
    nextUrl: { pathname: "/api/vouchers" },
    headers: new Headers(headers),
    cookies: { getAll: () => [], set: jest.fn() },
  } as never
}

describe("proxy security boundary", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com"
    process.env.UPSTASH_REDIS_REST_TOKEN = "token"
    process.env.ALLOWED_ORIGINS = "http://localhost:3000"
    incrMock.mockClear()
    expireMock.mockClear()
  })

  it("adds baseline browser security headers", async () => {
    const response = await proxy(createRequest())

    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff")
    expect(response.headers.get("X-Frame-Options")).toBe("DENY")
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin")
  })

  it("rejects cross-origin mutations when the origin is not allowlisted", async () => {
    const response = await proxy(createRequest("POST", { origin: "https://evil.example" }))

    expect(response.status).toBe(403)
  })

  it("does not let callers evade rate limiting by changing x-forwarded-for", async () => {
    await proxy(createRequest("GET", { "x-forwarded-for": "attacker-one" }))
    await proxy(createRequest("GET", { "x-forwarded-for": "attacker-two" }))

    expect(incrMock.mock.calls[0][0]).toBe(incrMock.mock.calls[1][0])
  })
})
