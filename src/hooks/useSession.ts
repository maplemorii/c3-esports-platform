/**
 * useSession.ts
 *
 * Typed wrapper around next-auth's useSession.
 * Returns a fully typed session including the user's Role.
 *
 * Usage:
 *   const { user, isLoading, isAuthenticated } = useSession()
 *   if (!isAuthenticated) return <SignInPrompt />
 *   console.log(user.role) // "ADMIN" | "STAFF" | "TEAM_MANAGER" | "USER"
 */

"use client"

import { useSession as useNextAuthSession } from "next-auth/react"
import type { Role } from "@prisma/client"
import { ROLE_HIERARCHY } from "@/lib/constants"

// ---------------------------------------------------------------------------
// Typed user shape (matches next-auth.d.ts augmentation)
// ---------------------------------------------------------------------------

export interface SessionUser {
  id:    string
  name:  string | null
  email: string | null
  image: string | null
  role:  Role
}

export interface UseSessionResult {
  user:            SessionUser | null
  isLoading:       boolean
  isAuthenticated: boolean
  /** True if the user's role is at least STAFF. */
  isStaff:         boolean
  /** True if the user's role is ADMIN. */
  isAdmin:         boolean
  /** True if the user's role is at least TEAM_MANAGER. */
  isManager:       boolean
  /** Raw next-auth status string. */
  status:          "loading" | "authenticated" | "unauthenticated"
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSession(): UseSessionResult {
  const { data: session, status } = useNextAuthSession()

  const user = session?.user
    ? {
        id:    session.user.id,
        name:  session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        role:  session.user.role,
      }
    : null

  const rank = user ? (ROLE_HIERARCHY[user.role] ?? 0) : -1

  return {
    user,
    isLoading:       status === "loading",
    isAuthenticated: status === "authenticated" && user !== null,
    isStaff:         rank >= ROLE_HIERARCHY.STAFF,
    isAdmin:         rank >= ROLE_HIERARCHY.ADMIN,
    isManager:       rank >= ROLE_HIERARCHY.TEAM_MANAGER,
    status,
  }
}
