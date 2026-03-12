/**
 * /admin/registrations
 *
 * Cross-season registration queue — all pending/waitlisted registrations
 * across every season, filterable by status and season.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/dates"
import { ClipboardList, Users, ChevronRight } from "lucide-react"
import { RegistrationActions } from "@/app/admin/seasons/[seasonId]/registrations/RegistrationActions"
import type { RegistrationStatus, DivisionTier } from "@prisma/client"

export const metadata: Metadata = { title: "Registrations — Staff" }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 40

const STATUS_META: Record<RegistrationStatus, { label: string; cls: string }> = {
  PENDING:    { label: "Pending",    cls: "bg-amber-500/15 text-amber-400" },
  WAITLISTED: { label: "Waitlisted", cls: "bg-sky-500/15 text-sky-400" },
  APPROVED:   { label: "Approved",   cls: "bg-emerald-500/15 text-emerald-400" },
  REJECTED:   { label: "Rejected",   cls: "bg-destructive/15 text-destructive" },
  WITHDRAWN:  { label: "Withdrawn",  cls: "bg-muted text-muted-foreground" },
}

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:     "Premier",
  CHALLENGERS: "Challengers",
  CONTENDERS:  "Contenders",
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "Pending",    value: "PENDING" },
  { label: "Waitlisted", value: "WAITLISTED" },
  { label: "Approved",   value: "APPROVED" },
  { label: "Rejected",   value: "REJECTED" },
  { label: "All",        value: "" },
]

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(opts: { status?: RegistrationStatus; seasonId?: string; page: number }) {
  const { status, seasonId, page } = opts

  const where = {
    ...(status   && { status }),
    ...(seasonId && { seasonId }),
  }

  const [registrations, total, seasons, pendingCount, waitlistedCount] = await Promise.all([
    prisma.seasonRegistration.findMany({
      where,
      orderBy: [{ status: "asc" }, { registeredAt: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id:           true,
        status:       true,
        notes:        true,
        registeredAt: true,
        reviewedAt:   true,
        season:   { select: { id: true, name: true } },
        division: { select: { id: true, name: true, tier: true } },
        team: {
          select: {
            id:      true,
            name:    true,
            slug:    true,
            logoUrl: true,
            _count:  { select: { memberships: { where: { leftAt: null } } } },
          },
        },
      },
    }),
    prisma.seasonRegistration.count({ where }),
    prisma.season.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true },
    }),
    prisma.seasonRegistration.count({ where: { status: "PENDING" } }),
    prisma.seasonRegistration.count({ where: { status: "WAITLISTED" } }),
  ])

  return {
    registrations,
    total,
    totalPages: Math.ceil(total / PAGE_SIZE),
    seasons,
    pendingCount,
    waitlistedCount,
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; seasonId?: string; page?: string }>
}) {
  const { status: statusParam, seasonId, page: pageParam } = await searchParams

  // Default to PENDING if no status filter set
  const statusFilter = statusParam !== undefined ? statusParam : "PENDING"
  const status = (statusFilter as RegistrationStatus | undefined) || undefined
  const page   = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1

  const { registrations, total, totalPages, seasons, pendingCount, waitlistedCount } =
    await getData({ status, seasonId, page })

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (statusFilter) p.set("status", statusFilter)
    if (seasonId)     p.set("seasonId", seasonId)
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k)
    })
    const s = p.toString()
    return `/admin/registrations${s ? `?${s}` : ""}`
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Page header card */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.7), rgba(59,130,246,0.4), transparent)" }}
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(196,28,53,0.8)" }}>
          Staff Panel
        </p>
        <h1 className="font-display text-3xl font-black uppercase tracking-wide">Registrations</h1>
        <div className="flex items-center gap-2 mt-1">
          {pendingCount > 0 && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-amber-400"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              {pendingCount} pending
            </span>
          )}
          {waitlistedCount > 0 && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-sky-400"
              style={{ background: "rgba(14,165,233,0.1)", border: "1px solid rgba(14,165,233,0.2)" }}
            >
              {waitlistedCount} waitlisted
            </span>
          )}
          {pendingCount === 0 && waitlistedCount === 0 && (
            <p className="text-sm text-muted-foreground">All caught up</p>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {STATUS_FILTERS.map(({ label, value }) => (
          <Link
            key={value}
            href={buildUrl({ status: value || undefined, page: undefined })}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0",
              statusFilter === value
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Season filter */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Season:</span>
        <Link
          href={buildUrl({ seasonId: undefined, page: undefined })}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            !seasonId ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground hover:bg-muted/30",
          )}
        >
          All
        </Link>
        {seasons.map((s) => (
          <Link
            key={s.id}
            href={buildUrl({ seasonId: s.id, page: undefined })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              seasonId === s.id ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground hover:bg-muted/30",
            )}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {/* Registration list */}
      {registrations.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <ClipboardList className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No registrations found.</p>
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {registrations.map((reg) => {
            const meta = STATUS_META[reg.status]
            return (
              <div
                key={reg.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >

                {/* Team info */}
                <div className="flex items-center gap-3 min-w-0">
                  {reg.team.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reg.team.logoUrl}
                      alt={reg.team.name}
                      className="h-10 w-10 shrink-0 rounded-md object-cover bg-muted"
                    />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-md bg-muted flex items-center justify-center">
                      <Users className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{reg.team.name}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", meta.cls)}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {reg.season.name}
                      {reg.division && ` · ${TIER_LABEL[reg.division.tier]}`}
                      {" · "}
                      {reg.team._count.memberships} member{reg.team._count.memberships !== 1 ? "s" : ""}
                      {" · Registered "}
                      {formatDate(new Date(reg.registeredAt))}
                    </p>
                    {reg.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5 italic truncate">{reg.notes}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/admin/seasons/${reg.season.id}/registrations`}
                    className="text-xs text-muted-foreground hover:text-brand transition-colors flex items-center gap-1"
                  >
                    Season queue <ChevronRight className="h-3 w-3" />
                  </Link>
                  <RegistrationActions
                    seasonId={reg.season.id}
                    regId={reg.id}
                    currentStatus={reg.status}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} registrations total</span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Previous
              </Link>
            )}
            <span className="text-xs">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
