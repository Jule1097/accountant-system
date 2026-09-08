import { proxy } from "src/proxy"

const incrMock = jest.fn().mockResolvedValue(1)
const expireMock = jest.fn()
const createServerClientMock = jest.fn()

jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({ incr: incrMock, expire: expireMock })),
}))

jest.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => createServerClientMock(...args),
}))

describe("proxy", () => {
  beforeEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = "https://redis.example.com"
    process.env.UPSTASH_REDIS_REST_TOKEN = "token"
    incrMock.mockClear()
    expireMock.mockClear()
    createServerClientMock.mockClear()
  })

  it("leaves API authentication and company context to the route layer", async () => {
    const response = await proxy({
      method: "GET",
      url: "http://localhost/api/vouchers",
      nextUrl: { pathname: "/api/vouchers" },
      headers: new Headers(),
      cookies: { getAll: () => [], set: jest.fn() },
    } as never)

    expect(response.status).toBe(200)
    expect(createServerClientMock).not.toHaveBeenCalled()
    expect(incrMock).toHaveBeenCalledTimes(1)
  })
})
