/**
 * /admin/seasons/:seasonId/registrations
 *
 * Staff registration approval queue.
 * Lists all registrations for a season grouped by status.
 * Pending registrations show Approve / Reject action buttons.
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { ChevronRight, Users, ClipboardList } from "lucide-react"
import { formatDate } from "@/lib/utils/dates"
import { RegistrationActions } from "./RegistrationActions"
import type { RegistrationStatus, DivisionTier } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(seasonId: string) {
  const season = await prisma.season.findUnique({
    where:  { id: seasonId },
    select: {
      id:   true,
      name: true,
      slug: true,
      divisions: {
        select: { id: true, name: true, tier: true },
        orderBy: { tier: "asc" },
      },
    },
  })
  if (!season) return null

  const registrations = await prisma.seasonRegistration.findMany({
    where:   { seasonId },
    orderBy: [{ status: "asc" }, { registeredAt: "asc" }],
    select: {
      id:           true,
      status:       true,
      notes:        true,
      registeredAt: true,
      reviewedAt:   true,
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
  })

  return { season, registrations }
}

type Data = NonNullable<Awaited<ReturnType<typeof getData>>>
type Registration = Data["registrations"][number]

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seasonId: string }>
}): Promise<Metadata> {
  const { seasonId } = await params
  const data = await getData(seasonId)
  return {
    title: data ? `Registrations — ${data.season.name}` : "Registrations",
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_ORDER: RegistrationStatus[] = [
  "PENDING", "WAITLISTED", "APPROVED", "REJECTED", "WITHDRAWN",
]

const STATUS_LABEL: Record<RegistrationStatus, string> = {
  PENDING:    "Pending Review",
  WAITLISTED: "Waitlisted",
  APPROVED:   "Approved",
  REJECTED:   "Rejected",
  WITHDRAWN:  "Withdrawn",
}

const STATUS_CLASSES: Record<RegistrationStatus, string> = {
  PENDING:    "bg-amber-500/15 text-amber-400",
  WAITLISTED: "bg-sky-500/15 text-sky-400",
  APPROVED:   "bg-emerald-500/15 text-emerald-400",
  REJECTED:   "bg-destructive/15 text-destructive",
  WITHDRAWN:  "bg-muted text-muted-foreground",
}

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:    "Premier",
  CHALLENGERS: "Open Challengers",
  CONTENDERS: "Open Contenders",
}

// ---------------------------------------------------------------------------
// Row component
// ---------------------------------------------------------------------------

function RegistrationRow({
  reg,
  seasonId,
}: {
  reg: Registration
  seasonId: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
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
          <p className="font-semibold truncate">{reg.team.name}</p>
          <p className="text-xs text-muted-foreground">
            {reg.team._count.memberships} member{reg.team._count.memberships !== 1 ? "s" : ""}
            {" · "}
            Registered {formatDate(new Date(reg.registeredAt))}
            {reg.division && (
              <>
                {" · "}
                <span className="font-medium text-foreground">
                  {TIER_LABEL[reg.division.tier]}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Status + actions */}
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            STATUS_CLASSES[reg.status]
          )}
        >
          {STATUS_LABEL[reg.status]}
        </span>
        <RegistrationActions
          seasonId={seasonId}
          regId={reg.id}
          currentStatus={reg.status}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ seasonId: string }>
}) {
  const { seasonId } = await params
  const data = await getData(seasonId)
  if (!data) notFound()

  const { season, registrations } = data

  // Group by status in display order
  const grouped = STATUS_ORDER.reduce<Record<RegistrationStatus, Registration[]>>(
    (acc, s) => {
      acc[s] = registrations.filter((r) => r.status === s)
      return acc
    },
    {} as Record<RegistrationStatus, Registration[]>
  )

  const pendingCount = grouped.PENDING.length + grouped.WAITLISTED.length

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/seasons" className="hover:text-brand transition-colors">
          Seasons
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/admin/seasons/${seasonId}`}
          className="hover:text-brand transition-colors"
        >
          {season.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Registrations</span>
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
            Registrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {registrations.length} total
            {pendingCount > 0 && (
              <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {registrations.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <ClipboardList className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">No registrations for this season yet.</p>
        </div>
      )}

      {/* Grouped sections */}
      <div className="space-y-8">
        {STATUS_ORDER.map((status) => {
          const rows = grouped[status]
          if (rows.length === 0) return null
          return (
            <section key={status}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    status === "PENDING"    && "bg-amber-400",
                    status === "WAITLISTED" && "bg-sky-400",
                    status === "APPROVED"   && "bg-emerald-400",
                    status === "REJECTED"   && "bg-destructive",
                    status === "WITHDRAWN"  && "bg-muted-foreground",
                  )}
                />
                {STATUS_LABEL[status]} ({rows.length})
              </h2>
              <ul className="space-y-2">
                {rows.map((reg) => (
                  <li key={reg.id}>
                    <RegistrationRow reg={reg} seasonId={seasonId} />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

    </div>
  )
}
