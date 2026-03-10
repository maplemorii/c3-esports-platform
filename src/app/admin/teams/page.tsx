/**
 * /admin/teams
 *
 * All teams — searchable, paginated list with member count, owner, season registration status.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/utils/dates"
import { Shield, Users, ChevronRight, Search } from "lucide-react"

export const metadata: Metadata = { title: "Teams — Admin" }

const PAGE_SIZE = 30

async function getData(search?: string, page = 1) {
  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  }

  const [teams, total] = await Promise.all([
    prisma.team.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id:        true,
        name:      true,
        slug:      true,
        logoUrl:   true,
        createdAt: true,
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            memberships: { where: { leftAt: null } },
            registrations: true,
          },
        },
        registrations: {
          orderBy: { registeredAt: "desc" },
          take: 1,
          select: {
            status: true,
            season: { select: { name: true } },
            division: { select: { name: true, tier: true } },
          },
        },
      },
    }),
    prisma.team.count({ where }),
  ])

  return { teams, total, totalPages: Math.ceil(total / PAGE_SIZE) }
}

export default async function AdminTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const { search, page: pageParam } = await searchParams
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1

  const { teams, total, totalPages } = await getData(search, page)

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (search) p.set("search", search)
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k)
    })
    const s = p.toString()
    return `/admin/teams${s ? `?${s}` : ""}`
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Teams</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString()} teams</p>
      </div>

      {/* Search */}
      <form method="GET" action="/admin/teams" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by name or slug…"
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </form>

      {/* Teams list */}
      {teams.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Shield className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No teams found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {teams.map((team) => {
            const latestReg = team.registrations[0]
            return (
              <Link
                key={team.id}
                href={`/admin/teams/${team.id}`}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                {/* Logo */}
                {team.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover bg-muted"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                    <Shield className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold truncate">{team.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    <span className="font-mono text-muted-foreground/60">{team.slug}</span>
                    {" · "}
                    <Users className="inline h-3 w-3 mb-px" /> {team._count.memberships} member{team._count.memberships !== 1 ? "s" : ""}
                    {team.owner.name && ` · Owner: ${team.owner.name}`}
                    {" · "}
                    {formatRelative(team.createdAt)}
                  </p>
                  {latestReg && (
                    <p className="text-xs">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        latestReg.status === "APPROVED"   && "bg-emerald-500/15 text-emerald-400",
                        latestReg.status === "PENDING"    && "bg-amber-500/15 text-amber-400",
                        latestReg.status === "WAITLISTED" && "bg-sky-500/15 text-sky-400",
                        latestReg.status === "REJECTED"   && "bg-destructive/15 text-destructive",
                        latestReg.status === "WITHDRAWN"  && "bg-muted text-muted-foreground",
                      )}>
                        {latestReg.status}
                      </span>
                      <span className="text-muted-foreground ml-1.5 text-[11px]">
                        {latestReg.season.name}
                        {latestReg.division && ` · ${latestReg.division.name}`}
                      </span>
                    </p>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground/60 shrink-0 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} teams total</span>
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
