import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig: NextConfig = {
  output: "standalone",
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
