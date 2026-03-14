import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const MINTLIFY_URL = process.env.MINTLIFY_URL ?? "https://c3-esports.mintlify.app"

const nextConfig: NextConfig = {
  output: "standalone",

  async rewrites() {
    return [
      // Proxy /docs and all sub-paths to the Mintlify deployment
      {
        source: "/docs",
        destination: `${MINTLIFY_URL}/docs`,
      },
      {
        source: "/docs/:path*",
        destination: `${MINTLIFY_URL}/docs/:path*`,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // Sentry org + project (set in CI/environment)
  org:     process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Silences the "Missing Sentry auth token" warning during local builds
  silent: !process.env.CI,

  // Upload source maps only in CI (requires SENTRY_AUTH_TOKEN)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Tree-shake Sentry debug code in production
  disableLogger: true,

  // Tunnel Sentry requests through your domain to avoid ad-blockers
  tunnelRoute: "/monitoring",
})
