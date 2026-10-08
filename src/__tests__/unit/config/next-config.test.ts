import nextConfig from "../../../../next.config"
import { inputLimits } from "src/lib/constants/input-limits"

describe("Next.js request body limits", () => {
  it("allows the complete parser multipart payload to reach the route handler", () => {
    expect(nextConfig.experimental?.proxyClientMaxBodySize).toBe("32mb")
    expect(inputLimits.maxParserRequestBytes).toBeLessThan(32 * 1024 * 1024)
  })
})
