"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Role } from "@prisma/client"
import { ROLE_HIERARCHY } from "@/lib/roles"

// Assignable via API (DEVELOPER is injected via env var, never set in DB)
const ASSIGNABLE_ROLES: Role[] = ["USER", "TEAM_MANAGER", "STAFF", "ADMIN", "OWNER"]

const ROLE_CLS: Record<Role, string> = {
  USER:         "text-muted-foreground",
  TEAM_MANAGER: "text-sky-400",
  STAFF:        "text-blue-400",
  ADMIN:        "text-destructive",
  OWNER:        "text-amber-400",
  DEVELOPER:    "text-purple-400",
}

function roleLabel(r: Role): string {
  if (r === "TEAM_MANAGER") return "Team Manager"
  return r.charAt(0) + r.slice(1).toLowerCase()
}

export function UserRoleSelect({
  userId,
  currentRole,
  viewerRole,
}: {
  userId:      string
  currentRole: Role
  viewerRole:  Role
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const viewerRank  = ROLE_HIERARCHY[viewerRole]
  const targetRank  = ROLE_HIERARCHY[currentRole]
  const canEdit     = targetRank < viewerRank

  // Options the viewer is allowed to assign
  const availableRoles = ASSIGNABLE_ROLES.filter(
    (r) => ROLE_HIERARCHY[r] < viewerRank
  )

  async function changeRole(role: Role) {
    if (role === currentRole) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/users", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId, role }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Failed to update role.")
        return
      }
      router.refresh()
    } catch {
      setError("Network error.")
    } finally {
      setLoading(false)
    }
  }

  // Read-only badge for users whose rank >= viewer's rank
  if (!canEdit) {
    return (
      <span
        className={cn(
          "rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium select-none",
          ROLE_CLS[currentRole],
        )}
      >
        {roleLabel(currentRole)}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="relative">
        {loading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground pointer-events-none" />
        )}
        <select
          value={currentRole}
          onChange={(e) => changeRole(e.target.value as Role)}
          disabled={loading}
          className={cn(
            "rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium appearance-none pr-7 cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-brand/40",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            ROLE_CLS[currentRole],
          )}
        >
          {availableRoles.map((r) => (
            <option key={r} value={r} className="text-foreground bg-card">
              {roleLabel(r)}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  )
}
