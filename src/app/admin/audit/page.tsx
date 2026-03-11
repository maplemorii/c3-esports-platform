/**
 * /admin/audit
 *
 * Paginated audit log — all staff/admin actions on the platform.
 * ADMIN only.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils/dates"
import { ClipboardList, ChevronRight } from "lucide-react"
import { ActionFilterSelect } from "./_components/ActionFilterSelect"

export const metadata: Metadata = { title: "Audit Log — Admin" }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50

// Human-readable labels for common actions
const ACTION_LABELS: Record<string, string> = {
  MATCH_RESULT_OVERRIDE:          "Score Override",
  MATCH_FORFEITED:                "Match Forfeited",
  MATCH_CANCELLED:                "Match Cancelled",
  MATCH_FORCE_CHECKIN:            "Force Check-In",
  MATCH_RESCHEDULED:              "Match Rescheduled",
  TEAM_REGISTRATION_APPROVED:     "Registration Approved",
  TEAM_REGISTRATION_REJECTED:     "Registration Rejected",
  DISPUTE_RESOLVED:               "Dispute Resolved",
  DISPUTE_DISMISSED:              "Dispute Dismissed",
  USER_ROLE_CHANGED:              "Role Changed",
  EDU_OVERRIDE_APPROVED:          "Edu Override Approved",
  EDU_OVERRIDE_REVOKED:           "Edu Override Revoked",
  STANDINGS_RECALCULATED:         "Standings Recalculated",
  SEASON_STATUS_CHANGED:          "Season Status Changed",
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(opts: {
  action?: string
  entityType?: string
  actorId?: string
  page: number
}) {
  const { action, entityType, actorId, page } = opts

  const where = {
    ...(action     && { action }),
    ...(entityType && { entityType }),
    ...(actorId    && { actorId }),
  }

  const [entries, total, actorOptions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id:         true,
        action:     true,
        entityType: true,
        entityId:   true,
        before:     true,
        after:      true,
        ipAddress:  true,
        createdAt:  true,
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
    // Distinct actions for filter dropdown
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ["action"],
      orderBy: { action: "asc" },
    }),
  ])

  return { entries, total, totalPages: Math.ceil(total / PAGE_SIZE), actorOptions }
}

// ---------------------------------------------------------------------------
// Entity link helper
// ---------------------------------------------------------------------------

function entityLink(entityType: string, entityId: string) {
  switch (entityType) {
    case "Match":  return `/admin/matches/${entityId}`
    case "Team":   return `/admin/teams/${entityId}`
    case "User":   return `/admin/users`
    case "Season": return `/admin/seasons/${entityId}`
    default:       return null
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entityType?: string; page?: string }>
}) {
  const { action, entityType, page: pageParam } = await searchParams
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1

  const { entries, total, totalPages, actorOptions } = await getData({ action, entityType, page })

  const distinctActions = actorOptions.map((a) => a.action)

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (action)     p.set("action",     action)
    if (entityType) p.set("entityType", entityType)
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k)
    })
    const s = p.toString()
    return `/admin/audit${s ? `?${s}` : ""}`
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Audit Log</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString()} entries</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {/* Action filter */}
        <ActionFilterSelect
          actions={distinctActions}
          current={action}
          entityType={entityType}
        />

        {/* Entity type filter */}
        <form method="GET" action="/admin/audit">
          {action && <input type="hidden" name="action" value={action} />}
          <select
            name="entityType"
            defaultValue={entityType ?? ""}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
          >
            <option value="">All entities</option>
            {["Match", "Team", "User", "Season", "Division", "Registration", "Dispute"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </form>

        {(action || entityType) && (
          <Link
            href="/admin/audit"
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            Clear filters
          </Link>
        )}
      </div>

      {/* Log entries */}
      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No audit log entries found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {entries.map((entry) => {
            const link = entityLink(entry.entityType, entry.entityId)
            const label = ACTION_LABELS[entry.action] ?? entry.action

            return (
              <div key={entry.id} className="flex items-start gap-4 px-5 py-4">
                {/* Timestamp + actor */}
                <div className="shrink-0 w-36 text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(new Date(entry.createdAt))}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                {/* Action details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                      {entry.entityType}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by{" "}
                    <span className="font-medium text-foreground">
                      {entry.actor.name ?? entry.actor.email}
                    </span>
                    {" "}
                    <span className="text-muted-foreground/60">({entry.actor.role})</span>
                  </p>

                  {/* Before/after diff preview */}
                  {(entry.before || entry.after) && (
                    <div className="mt-1.5 grid grid-cols-2 gap-2 max-w-lg">
                      {entry.before && (
                        <div className="rounded border border-border bg-muted/30 p-2">
                          <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1">Before</p>
                          <pre className="text-[10px] text-muted-foreground overflow-hidden whitespace-pre-wrap break-all line-clamp-3">
                            {JSON.stringify(entry.before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {entry.after && (
                        <div className="rounded border border-border bg-muted/30 p-2">
                          <p className="text-[9px] font-semibold uppercase text-muted-foreground/60 mb-1">After</p>
                          <pre className="text-[10px] text-muted-foreground overflow-hidden whitespace-pre-wrap break-all line-clamp-3">
                            {JSON.stringify(entry.after, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Entity link */}
                {link && (
                  <Link
                    href={link}
                    className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground hover:text-brand transition-colors"
                  >
                    View <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} entries total</span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted/30 transition-colors">
                Previous
              </Link>
            )}
            <span className="text-xs">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted/30 transition-colors">
                Next
              </Link>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
