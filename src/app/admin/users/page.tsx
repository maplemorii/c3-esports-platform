/**
 * /admin/users
 *
 * User management — paginated list with inline role assignment and edu override.
 * ADMIN only.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/utils/dates"
import { Users, GraduationCap, CheckCircle2, Search } from "lucide-react"
import { UserRoleSelect } from "./_components/UserRoleSelect"
import { EduOverrideButton } from "./_components/EduOverrideButton"
import type { Role } from "@prisma/client"

export const metadata: Metadata = { title: "Users — Admin" }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 30

const ROLE_META: Record<Role, { label: string; cls: string }> = {
  USER:         { label: "User",         cls: "bg-muted text-muted-foreground" },
  TEAM_MANAGER: { label: "Team Manager", cls: "bg-sky-500/15 text-sky-400" },
  STAFF:        { label: "Staff",        cls: "bg-violet-500/15 text-violet-400" },
  ADMIN:        { label: "Admin",        cls: "bg-destructive/15 text-destructive" },
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(opts: {
  search?: string
  role?: Role
  page: number
}) {
  const { search, role, page } = opts

  const where = {
    deletedAt: null,
    ...(role && { role }),
    ...(search && {
      OR: [
        { name:  { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { player: { displayName: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id:        true,
        name:      true,
        email:     true,
        role:      true,
        image:     true,
        createdAt: true,
        player: { select: { displayName: true } },
        eduEmail:          true,
        eduEmailVerified:  true,
        eduVerifyOverride: true,
        eduVerifyNote:     true,
      },
    }),
    prisma.user.count({ where }),
  ])

  return { users, total, totalPages: Math.ceil(total / PAGE_SIZE) }
}

// ---------------------------------------------------------------------------
// Role filter tabs
// ---------------------------------------------------------------------------

const ROLE_FILTERS: { label: string; value: string }[] = [
  { label: "All",          value: "" },
  { label: "Users",        value: "USER" },
  { label: "Team Managers",value: "TEAM_MANAGER" },
  { label: "Staff",        value: "STAFF" },
  { label: "Admins",       value: "ADMIN" },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>
}) {
  const { search, role: roleParam, page: pageParam } = await searchParams
  const role = (roleParam as Role | undefined) || undefined
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1

  const { users, total, totalPages } = await getData({ search, role, page })

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (search)    p.set("search", search)
    if (roleParam) p.set("role",   roleParam)
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k)
    })
    const s = p.toString()
    return `/admin/users${s ? `?${s}` : ""}`
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString()} total</p>
        </div>
      </div>

      {/* Role tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {ROLE_FILTERS.map(({ label, value }) => (
          <Link
            key={value}
            href={buildUrl({ role: value || undefined, page: undefined })}
            className={cn(
              "shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              (roleParam ?? "") === value
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/users" className="relative">
        {roleParam && <input type="hidden" name="role" value={roleParam} />}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search by name, email, or display name…"
          className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </form>

      {/* User list */}
      {users.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {users.map((user) => {
            const roleMeta = ROLE_META[user.role]
            const eduVerified = !!(user.eduEmailVerified || user.eduVerifyOverride)

            return (
              <div key={user.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

                {/* User info */}
                <div className="flex items-center gap-3 min-w-0">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name ?? ""}
                      className="h-9 w-9 shrink-0 rounded-full object-cover bg-muted"
                    />
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">
                        {user.name ?? <span className="text-muted-foreground italic">No name</span>}
                      </p>
                      {user.player?.displayName && (
                        <span className="text-xs text-muted-foreground">({user.player.displayName})</span>
                      )}
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", roleMeta.cls)}>
                        {roleMeta.label}
                      </span>
                      {eduVerified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          <GraduationCap className="h-2.5 w-2.5" />
                          College
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                      {" · "}
                      Joined {formatRelative(user.createdAt)}
                    </p>
                    {user.eduEmail && (
                      <p className="text-xs text-muted-foreground/60 truncate flex items-center gap-1 mt-0.5">
                        <GraduationCap className="h-3 w-3" />
                        {user.eduEmail}
                        {user.eduEmailVerified && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        {user.eduVerifyOverride && <span className="text-violet-400">(override)</span>}
                        {user.eduVerifyNote && <span className="italic">— {user.eduVerifyNote}</span>}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-3 shrink-0 flex-wrap justify-end">
                  <UserRoleSelect userId={user.id} currentRole={user.role} />
                  <EduOverrideButton
                    userId={user.id}
                    currentOverride={user.eduVerifyOverride ?? false}
                    currentNote={user.eduVerifyNote}
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
          <span>{total} users total</span>
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
