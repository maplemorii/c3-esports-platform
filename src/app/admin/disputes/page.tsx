/**
 * /admin/disputes
 *
 * Staff disputes queue — all disputes paginated, filterable by status.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/utils/dates"
import { AlertTriangle, ChevronRight, CheckCircle2, XCircle, Eye } from "lucide-react"
import type { DisputeStatus } from "@prisma/client"

export const metadata: Metadata = { title: "Disputes — Staff" }

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20

async function getData(status?: DisputeStatus, page = 1) {
  const where = status ? { status } : {}
  const skip  = (page - 1) * PAGE_SIZE

  const [disputes, total, openCount, reviewCount] = await Promise.all([
    prisma.dispute.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip,
      take:  PAGE_SIZE,
      select: {
        id:            true,
        status:        true,
        reason:        true,
        createdAt:     true,
        resolvedAt:    true,
        filedByTeamId: true,
        match: {
          select: {
            id:        true,
            homeScore: true,
            awayScore: true,
            homeTeam:  { select: { id: true, name: true } },
            awayTeam:  { select: { id: true, name: true } },
            division:  { select: { name: true, season: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.dispute.count({ where }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.dispute.count({ where: { status: "UNDER_REVIEW" } }),
  ])

  return { disputes, total, openCount, reviewCount, page, totalPages: Math.ceil(total / PAGE_SIZE) }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<DisputeStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  OPEN:         { label: "Open",         cls: "bg-destructive/15 text-destructive",  icon: <AlertTriangle className="h-3 w-3" /> },
  UNDER_REVIEW: { label: "Under Review", cls: "bg-amber-500/15 text-amber-400",      icon: <Eye className="h-3 w-3" /> },
  RESOLVED:     { label: "Resolved",     cls: "bg-emerald-500/15 text-emerald-400",  icon: <CheckCircle2 className="h-3 w-3" /> },
  DISMISSED:    { label: "Dismissed",    cls: "bg-muted text-muted-foreground",       icon: <XCircle className="h-3 w-3" /> },
}

const STATUS_FILTERS: { label: string; value: DisputeStatus | "" }[] = [
  { label: "All",          value: "" },
  { label: "Open",         value: "OPEN" },
  { label: "Under Review", value: "UNDER_REVIEW" },
  { label: "Resolved",     value: "RESOLVED" },
  { label: "Dismissed",    value: "DISMISSED" },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status: statusParam, page: pageParam } = await searchParams
  const status = (statusParam as DisputeStatus | undefined) || undefined
  const page   = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1

  const { disputes, total, openCount, reviewCount, totalPages } = await getData(status, page)

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
        <h1 className="font-display text-3xl font-black uppercase tracking-wide">Disputes</h1>
        <div className="flex items-center gap-3 mt-1">
          {openCount > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium text-destructive"
              style={{ background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.2)" }}
            >
              {openCount} open
            </span>
          )}
          {reviewCount > 0 && (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium text-amber-400"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              {reviewCount} under review
            </span>
          )}
          {openCount === 0 && reviewCount === 0 && (
            <p className="text-sm text-muted-foreground">No active disputes</p>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {STATUS_FILTERS.map(({ label, value }) => (
          <Link
            key={value}
            href={value ? `/admin/disputes?status=${value}` : "/admin/disputes"}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              (status ?? "") === value
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Disputes list */}
      {disputes.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No disputes found.</p>
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {disputes.map((dispute) => {
            const meta = STATUS_META[dispute.status]
            // Derive filing team name from match participants
            const filingTeamName =
              dispute.match.homeTeam.id === dispute.filedByTeamId
                ? dispute.match.homeTeam.name
                : dispute.match.awayTeam.name

            return (
              <Link
                key={dispute.id}
                href={`/admin/disputes/${dispute.id}`}
                className="group flex items-start gap-4 px-5 py-4 hover:bg-white/3 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                {/* Status icon */}
                <div className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  meta.cls,
                )}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {dispute.match.homeTeam.name} vs {dispute.match.awayTeam.name}
                    </span>
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      meta.cls,
                    )}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dispute.match.division.season.name} · {dispute.match.division.name}
                    {" · "} Filed by {filingTeamName}
                  </p>
                  <p className="text-xs text-muted-foreground/80 line-clamp-1">{dispute.reason}</p>
                </div>

                {/* Time + score */}
                <div className="shrink-0 text-right space-y-1">
                  <p className="text-xs text-muted-foreground">{formatRelative(dispute.createdAt)}</p>
                  {dispute.match.homeScore !== null && (
                    <p className="text-xs font-bold font-display tabular-nums">
                      {dispute.match.homeScore} – {dispute.match.awayScore}
                    </p>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors shrink-0 mt-0.5" />
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} disputes total</span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/disputes?${status ? `status=${status}&` : ""}page=${page - 1}`}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                Previous
              </Link>
            )}
            <span className="text-xs">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link
                href={`/admin/disputes?${status ? `status=${status}&` : ""}page=${page + 1}`}
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
