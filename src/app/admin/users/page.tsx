/**
 * /admin/users
 *
 * User management — paginated list with inline role assignment and edu override.
 * ADMIN only.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/utils/dates";
import { Users, GraduationCap, CheckCircle2, Search } from "lucide-react";
import { UserRoleSelect } from "./_components/UserRoleSelect";
import { EduOverrideButton } from "./_components/EduOverrideButton";
import type { Role } from "@prisma/client";

export const metadata: Metadata = { title: "Users — Admin" };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 30;

const ROLE_META: Record<Role, { label: string; bg: string; color: string }> = {
  USER: {
    label: "User",
    bg: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.4)",
  },
  TEAM_MANAGER: {
    label: "Team Manager",
    bg: "rgba(14,165,233,0.12)",
    color: "rgba(56,189,248,0.9)",
  },
  STAFF: {
    label: "Staff",
    bg: "rgba(59,130,246,0.12)",
    color: "rgba(96,165,250,0.9)",
  },
  ADMIN: {
    label: "Admin",
    bg: "rgba(196,28,53,0.12)",
    color: "rgba(220,60,80,0.9)",
  },
};

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(opts: { search?: string; role?: Role; page: number }) {
  const { search, role, page } = opts;

  const where = {
    deletedAt: null,
    ...(role && { role }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        {
          player: {
            displayName: { contains: search, mode: "insensitive" as const },
          },
        },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        player: { select: { displayName: true } },
        eduEmail: true,
        eduEmailVerified: true,
        eduVerifyOverride: true,
        eduVerifyNote: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ---------------------------------------------------------------------------
// Role filter tabs
// ---------------------------------------------------------------------------

const ROLE_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Users", value: "USER" },
  { label: "Team Managers", value: "TEAM_MANAGER" },
  { label: "Staff", value: "STAFF" },
  { label: "Admins", value: "ADMIN" },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; page?: string }>;
}) {
  const { search, role: roleParam, page: pageParam } = await searchParams;
  const role = (roleParam as Role | undefined) || undefined;
  const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;

  const { users, total, totalPages } = await getData({ search, role, page });

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (roleParam) p.set("role", roleParam);
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v);
      else p.delete(k);
    });
    const s = p.toString();
    return `/admin/users${s ? `?${s}` : ""}`;
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
          style={{
            background:
              "linear-gradient(90deg, rgba(196,28,53,0.7), rgba(59,130,246,0.4), transparent)",
          }}
          aria-hidden
        />
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-1"
          style={{ color: "rgba(196,28,53,0.8)" }}
        >
          Staff Panel
        </p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-wide">
              Users
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {total.toLocaleString()} total accounts
            </p>
          </div>
        </div>
      </div>

      {/* Role tabs */}
      <div
        className="flex gap-1 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
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
          className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-brand/40"
          style={{ border: "1px solid rgba(255,255,255,0.08)" }}
        />
      </form>

      {/* User list */}
      {users.length === 0 ? (
        <div
          className="rounded-2xl p-10 text-center"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <Users className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No users found.</p>
        </div>
      ) : (
        <div
          className="relative overflow-hidden rounded-2xl divide-y divide-[rgba(255,255,255,0.04)]"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {users.map((user) => {
            const roleMeta = ROLE_META[user.role];
            const eduVerified = !!(
              user.eduEmailVerified || user.eduVerifyOverride
            );

            return (
              <div
                key={user.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                {/* User info */}
                <Link
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name ?? ""}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  ) : (
                    <div
                      className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                      style={{
                        background: "rgba(196,28,53,0.15)",
                        border: "1px solid rgba(196,28,53,0.2)",
                      }}
                    >
                      {(user.name ?? user.email ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">
                        {user.name ?? (
                          <span className="text-muted-foreground italic">
                            No name
                          </span>
                        )}
                      </p>
                      {user.player?.displayName && (
                        <span className="text-xs text-muted-foreground">
                          ({user.player.displayName})
                        </span>
                      )}
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                        style={{
                          background: roleMeta.bg,
                          color: roleMeta.color,
                        }}
                      >
                        {roleMeta.label}
                      </span>
                      {eduVerified && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-emerald-400"
                          style={{
                            background: "rgba(52,211,153,0.08)",
                            border: "1px solid rgba(52,211,153,0.15)",
                          }}
                        >
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
                        {user.eduEmailVerified && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        )}
                        {user.eduVerifyOverride && (
                          <span className="text-blue-400">(override)</span>
                        )}
                        {user.eduVerifyNote && (
                          <span className="italic">— {user.eduVerifyNote}</span>
                        )}
                      </p>
                    )}
                  </div>
                </Link>

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
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} users total</span>
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
            <span className="text-xs">
              Page {page} of {totalPages}
            </span>
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
  );
}
