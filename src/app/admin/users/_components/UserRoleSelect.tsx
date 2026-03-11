"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Role } from "@prisma/client"

const ROLES: Role[] = ["USER", "TEAM_MANAGER", "STAFF", "ADMIN"]

const ROLE_CLS: Record<Role, string> = {
  USER:         "text-muted-foreground",
  TEAM_MANAGER: "text-sky-400",
  STAFF:        "text-blue-400",
  ADMIN:        "text-destructive",
}

export function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: Role
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

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
          {ROLES.map((r) => (
            <option key={r} value={r} className="text-foreground bg-card">
              {r === "TEAM_MANAGER" ? "Team Manager" : r.charAt(0) + r.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  )
}
