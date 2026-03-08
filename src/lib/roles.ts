import type { Role } from "@prisma/client"

export type { Role }

// Numeric rank — higher = more privileged.
// Used in both middleware (edge) and server code, so no Node.js imports here.
export const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 0,
  TEAM_MANAGER: 1,
  STAFF: 2,
  ADMIN: 3,
}

/** Returns true if `userRole` meets or exceeds `required`. */
export function hasMinRole(
  userRole: Role | null | undefined,
  required: Role
): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required]
}
