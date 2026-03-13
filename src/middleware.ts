import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { hasMinRole } from "@/lib/roles"
import type { Role } from "@/lib/roles"

// ---------------------------------------------------------------------------
// Beta gate helpers
// ---------------------------------------------------------------------------

const BETA_COOKIE = "beta_access"

/** Constant-time comparison to prevent timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function expectedBetaToken(): string {
  // Use NEXTAUTH_SECRET so we don't need an extra env var.
  // Any change to NEXTAUTH_SECRET invalidates all existing beta cookies.
  const secret = process.env.BETA_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev"
  return Buffer.from(`beta:${secret}`).toString("base64url")
}

function isValidBetaToken(value: string): boolean {
  return safeEqual(value, expectedBetaToken())
}

/** These paths are always reachable, gate or not. */
function isBetaBypass(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/beta") ||
    pathname.startsWith("/api/beta-access") ||
    pathname.startsWith("/api/health") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/logo") ||
    pathname.startsWith("/images")
  )
}

// ---------------------------------------------------------------------------
// Auth/role config
// ---------------------------------------------------------------------------

const ROUTE_ROLES: Array<{ prefix: string; role: Role }> = [
  { prefix: "/admin",      role: "ADMIN" },
  { prefix: "/api/admin",  role: "ADMIN" },
  { prefix: "/staff",      role: "STAFF" },
  { prefix: "/api/staff",  role: "STAFF" },
  { prefix: "/team",       role: "TEAM_MANAGER" },
  { prefix: "/api/teams",  role: "TEAM_MANAGER" },
]

const AUTH_REQUIRED = [
  "/dashboard",
  "/profile",
  "/matches",
  "/team",
  "/staff",
  "/admin",
  "/api/teams",
  "/api/players",
  "/api/staff",
  "/api/admin",
]

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── 1. Beta gate ──────────────────────────────────────────────────────────
  if (process.env.BETA_GATE_ENABLED === "true" && !isBetaBypass(pathname)) {
    const cookie = req.cookies.get(BETA_COOKIE)?.value
    if (!cookie || !isValidBetaToken(cookie)) {
      return NextResponse.redirect(new URL("/beta", req.url))
    }
  }

  // ── 2. Auth & role checks (protected routes only) ────────────────────────
  const needsAuth = AUTH_REQUIRED.some((p) => pathname.startsWith(p))
  if (!needsAuth) return NextResponse.next()

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = new URL("/auth/signin", req.url)
    url.searchParams.set("callbackUrl", req.url)
    return NextResponse.redirect(url)
  }

  const role = token.role as Role | undefined
  const isApi = pathname.startsWith("/api/")

  for (const { prefix, role: required } of ROUTE_ROLES) {
    if (!pathname.startsWith(prefix)) continue
    if (!hasMinRole(role, required)) {
      return isApi
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.redirect(new URL("/unauthorized", req.url))
    }
    break
  }

  return NextResponse.next()
}

export const config = {
  // Run on everything except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
