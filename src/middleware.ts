import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { hasMinRole } from "@/lib/roles"
import type { Role } from "@/lib/roles"

/**
 * Route → minimum role required to access it.
 * Checked in order; first match wins.
 */
const ROUTE_ROLES: Array<{ prefix: string; role: Role }> = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/api/admin", role: "ADMIN" },
  { prefix: "/staff", role: "STAFF" },
  { prefix: "/api/staff", role: "STAFF" },
  { prefix: "/team", role: "TEAM_MANAGER" },
  { prefix: "/api/teams", role: "TEAM_MANAGER" },
]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const role = req.nextauth.token?.role as Role | undefined
    const isApi = pathname.startsWith("/api/")

    for (const { prefix, role: required } of ROUTE_ROLES) {
      if (!pathname.startsWith(prefix)) continue

      if (!hasMinRole(role, required)) {
        // Authenticated but insufficiently privileged
        return isApi
          ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
          : NextResponse.redirect(new URL("/unauthorized", req.url))
      }
      break
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      // Returning false redirects unauthenticated users to the sign-in page.
      // Role checks happen inside the middleware function above.
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    // Protected page routes
    "/dashboard/:path*",
    "/team/:path*",
    "/staff/:path*",
    "/admin/:path*",
    // Protected API routes
    "/api/teams/:path*",
    "/api/staff/:path*",
    "/api/admin/:path*",
  ],
}
