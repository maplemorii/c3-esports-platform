import { getServerSession } from "next-auth"
import type { Session } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { hasMinRole } from "@/lib/roles"
import type { Role } from "@/lib/roles"

type AuthSuccess = { session: Session; error: null }
type AuthFailure = { session: null; error: NextResponse }
type AuthResult = AuthSuccess | AuthFailure

/** Retrieves the current server-side session (Server Components, Route Handlers). */
export function getSession() {
  return getServerSession(authOptions)
}

/**
 * Asserts the request is authenticated.
 * Returns the session or a 401 NextResponse — no throws needed in callers.
 *
 * @example
 * const { session, error } = await requireAuth()
 * if (error) return error
 */
export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession()
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { session, error: null }
}

/**
 * Asserts the request is authenticated AND the user has at least `role`.
 * Returns the session or a 401/403 NextResponse.
 *
 * @example
 * const { session, error } = await requireRole("STAFF")
 * if (error) return error
 */
export async function requireRole(role: Role): Promise<AuthResult> {
  const result = await requireAuth()
  if (result.error) return result

  if (!hasMinRole(result.session.user.role, role)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return result
}
