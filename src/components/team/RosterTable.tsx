/**
 * RosterTable
 *
 * Displays a team's active roster as a styled list.
 * Works on both the public team profile and the dashboard team hub.
 *
 * Usage:
 *   <RosterTable members={team.memberships} />
 */

import { Users, Crown, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MembershipRole } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RosterMember {
  id:        string
  role:      MembershipRole
  isCaptain: boolean
  player: {
    id:             string
    displayName:    string
    avatarUrl:      string | null
    user?:          { image: string | null } | null
  } | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RosterTable({ members }: { members: RosterMember[] }) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Users className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No players on the roster yet.</p>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-border">
      {members.map((m) => (
        <li key={m.id} className="flex items-center gap-4 px-6 py-3.5">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground">
            {(m.player?.avatarUrl ?? m.player?.user?.image) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={(m.player!.avatarUrl ?? m.player!.user?.image)!}
                alt={m.player!.displayName}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <UserRound className="h-4 w-4" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm font-medium truncate">
                {m.player?.displayName ?? "Unknown"}
              </span>
              {m.isCaptain && (
                <Crown
                  className="h-3.5 w-3.5 shrink-0 text-yellow-500"
                  aria-label="Captain"
                />
              )}
            </div>
          </div>

          <RoleBadge role={m.role} />
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------
// RoleBadge
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: MembershipRole }) {
  const map: Record<MembershipRole, { label: string; cls: string }> = {
    PLAYER:     { label: "Player", cls: "bg-muted text-muted-foreground" },
    SUBSTITUTE: { label: "Sub",    cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
    COACH:      { label: "Coach",  cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  }
  const { label, cls } = map[role]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        cls
      )}
    >
      {label}
    </span>
  )
}
