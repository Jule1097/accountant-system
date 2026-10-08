import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@firecrawl/pdf-inspector"],
  experimental: {
    proxyClientMaxBodySize: "32mb",
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false
      }
    ]
  }
};

export default nextConfig;