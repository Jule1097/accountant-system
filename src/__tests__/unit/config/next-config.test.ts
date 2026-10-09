import nextConfig from "../../../../next.config"

describe("Next.js configuration", () => {
  it("defines standalone output and required external server packages", () => {
    expect(nextConfig.output).toBe("standalone")
    expect(nextConfig.serverExternalPackages).toContain("@firecrawl/pdf-inspector")
  })

  it("does not configure a parser transport body-size override", () => {
    expect(nextConfig).not.toHaveProperty("experimental.proxyClientMaxBodySize")
  })
})
