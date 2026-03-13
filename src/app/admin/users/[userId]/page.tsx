/**
 * /admin/users/[userId]
 *
 * Full account detail for a single user — auth info, edu verification,
 * player profile, game accounts, and team memberships.
 * STAFF+ only (inherited from admin layout).
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatDate, formatRelative } from "@/lib/utils/dates"
import {
  ArrowLeft,
  User,
  GraduationCap,
  CheckCircle2,
  XCircle,
  Gamepad2,
  Users,
  ExternalLink,
  Shield,
  Calendar,
} from "lucide-react"
import { UserRoleSelect } from "../_components/UserRoleSelect"
import { EduOverrideButton } from "../_components/EduOverrideButton"
import { DisableUserButton } from "../_components/DisableUserButton"
import { getSession } from "@/lib/session"
import type { Role, MembershipRole } from "@prisma/client"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLE_META: Record<Role, { label: string; bg: string; color: string; boxShadow?: string }> = {
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
  OWNER: {
    label: "Owner",
    bg: "rgba(245,158,11,0.12)",
    color: "rgba(251,191,36,0.9)",
  },
  DEVELOPER: {
    label: "Developer",
    bg: "rgba(168,85,247,0.15)",
    color: "rgba(216,180,254,0.95)",
    boxShadow: "0 0 8px rgba(168,85,247,0.5), inset 0 0 8px rgba(168,85,247,0.08)",
  },
}

const MEMBERSHIP_ROLE_LABEL: Record<MembershipRole, string> = {
  PLAYER: "Player",
  SUBSTITUTE: "Substitute",
  COACH: "Coach",
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      eduEmail: true,
      eduEmailVerified: true,
      eduVerifyOverride: true,
      eduVerifyNote: true,
      player: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          epicUsername: true,
          steamId: true,
          discordUsername: true,
          bio: true,
          createdAt: true,
          memberships: {
            where: { leftAt: null },
            orderBy: { joinedAt: "desc" },
            select: {
              id: true,
              role: true,
              isCaptain: true,
              joinedAt: true,
              team: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>
}): Promise<Metadata> {
  const { userId } = await params
  const user = await getData(userId)
  if (!user) return { title: "User Not Found — Admin" }
  return { title: `${user.name ?? user.email} — Admin` }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const [user, session] = await Promise.all([getData(userId), getSession()])
  if (!user) notFound()
  const viewerRole: Role = (session?.user?.role as Role) ?? "ADMIN"

  const displayRole: Role =
    process.env.DEVELOPER_USER_ID && user.id === process.env.DEVELOPER_USER_ID
      ? "DEVELOPER"
      : user.role
  const roleMeta = ROLE_META[displayRole]
  const eduVerified = !!(user.eduEmailVerified || user.eduVerifyOverride)
  const player = user.player

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Users
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{user.name ?? user.email}</span>
      </div>

      {/* Header card */}
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
        <div className="flex items-center gap-4">
          {user.image || player?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(user.image ?? player?.avatarUrl) as string}
              alt={user.name ?? ""}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover"
              style={{ border: "1px solid rgba(255,255,255,0.1)" }}
            />
          ) : (
            <div
              className="h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
              style={{
                background: "rgba(196,28,53,0.12)",
                border: "1px solid rgba(196,28,53,0.2)",
              }}
            >
              {(user.name ?? user.email ?? "?")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-black uppercase tracking-wide">
                {user.name ?? (
                  <span className="text-muted-foreground italic text-lg">No name</span>
                )}
              </h1>
              <span
                className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
                style={{ background: roleMeta.bg, color: roleMeta.color, boxShadow: roleMeta.boxShadow }}
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
            {player?.displayName && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {player.displayName}
              </p>
            )}
            {user.deletedAt && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-destructive mt-1"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                Disabled
              </span>
            )}
            <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              Joined {formatRelative(user.createdAt)}
              {" · "}
              <span className="font-mono text-[10px]">{user.id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Auth account */}
      <Section
        icon={<User className="h-4 w-4" />}
        title="Account"
        accent="red"
      >
        <Row label="Email" value={user.email} mono />
        <Row
          label="Role"
          value={
            <UserRoleSelect userId={user.id} currentRole={displayRole} viewerRole={viewerRole} />
          }
        />
        <Row label="User ID" value={user.id} mono dim />
        {player?.id && <Row label="Player ID" value={player.id} mono dim />}
        <Row
          label="Account Status"
          value={
            <div className="flex items-center gap-3">
              <span className={user.deletedAt ? "text-destructive" : "text-emerald-400"}>
                {user.deletedAt ? "Disabled" : "Active"}
              </span>
              <DisableUserButton userId={user.id} isDisabled={!!user.deletedAt} />
            </div>
          }
        />
      </Section>

      {/* Edu verification */}
      <Section
        icon={<GraduationCap className="h-4 w-4" />}
        title="Education Verification"
        accent="blue"
      >
        {user.eduEmail ? (
          <>
            <Row label="Edu Email" value={user.eduEmail} mono />
            <Row
              label="Email Verified"
              value={
                user.eduEmailVerified ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5" />
                    Not verified
                  </span>
                )
              }
            />
            <Row
              label="Manual Override"
              value={
                <div className="flex items-center gap-3">
                  <span
                    className={
                      user.eduVerifyOverride
                        ? "text-blue-400"
                        : "text-muted-foreground"
                    }
                  >
                    {user.eduVerifyOverride ? "Active" : "None"}
                  </span>
                  <EduOverrideButton
                    userId={user.id}
                    currentOverride={user.eduVerifyOverride ?? false}
                    currentNote={user.eduVerifyNote}
                  />
                </div>
              }
            />
            {user.eduVerifyNote && (
              <Row label="Note" value={user.eduVerifyNote} />
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground px-1 py-2">
            No edu email on file.
          </p>
        )}
      </Section>

      {/* Player profile */}
      {player ? (
        <Section
          icon={<Shield className="h-4 w-4" />}
          title="Player Profile"
          accent="red"
        >
          <Row label="Display Name" value={player.displayName} />
          {player.bio && <Row label="Bio" value={player.bio} />}
          <Row label="Profile Created" value={formatDate(player.createdAt)} />
        </Section>
      ) : (
        <Section
          icon={<Shield className="h-4 w-4" />}
          title="Player Profile"
          accent="red"
        >
          <p className="text-sm text-muted-foreground px-1 py-2">
            No player profile created yet.
          </p>
        </Section>
      )}

      {/* Game accounts */}
      <Section
        icon={<Gamepad2 className="h-4 w-4" />}
        title="Game Accounts"
        accent="blue"
      >
        {player ? (
          <>
            <Row
              label="Epic / Rocket League"
              value={player.epicUsername ?? (
                <span className="text-muted-foreground/50 italic">Not set</span>
              )}
              mono={!!player.epicUsername}
            />
            <Row
              label="Steam ID"
              value={player.steamId ?? (
                <span className="text-muted-foreground/50 italic">Not set</span>
              )}
              mono={!!player.steamId}
            />
            <Row
              label="Discord"
              value={player.discordUsername ?? (
                <span className="text-muted-foreground/50 italic">Not set</span>
              )}
              mono={!!player.discordUsername}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground px-1 py-2">
            No player profile — game accounts unavailable.
          </p>
        )}
      </Section>

      {/* Active team memberships */}
      <Section
        icon={<Users className="h-4 w-4" />}
        title="Active Teams"
        accent="red"
      >
        {player && player.memberships.length > 0 ? (
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {player.memberships.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                {m.team.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.team.logoUrl}
                    alt={m.team.name}
                    className="h-9 w-9 shrink-0 rounded-xl object-cover"
                    style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                ) : (
                  <div
                    className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center text-xs font-black text-white"
                    style={{ background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.15)" }}
                  >
                    {m.team.name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{m.team.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {MEMBERSHIP_ROLE_LABEL[m.role]}
                    {m.isCaptain && " · Captain"}
                    {" · "}
                    Joined {formatRelative(m.joinedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/teams/${m.team.id}`}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Admin
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground px-1 py-2">
            Not currently on any team.
          </p>
        )}
      </Section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function Section({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode
  title: string
  accent: "red" | "blue"
  children: React.ReactNode
}) {
  const gradientFrom =
    accent === "red"
      ? "rgba(196,28,53,0.6)"
      : "rgba(59,130,246,0.5)"
  const gradientTo =
    accent === "red"
      ? "rgba(59,130,246,0.3)"
      : "rgba(196,28,53,0.2)"
  const iconBg =
    accent === "red"
      ? { background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.2)", color: "rgba(196,28,53,0.9)" }
      : { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "rgba(96,165,250,0.9)" }

  return (
    <div
      className="relative overflow-hidden rounded-2xl"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo}, transparent)`,
        }}
        aria-hidden
      />
      {/* Section header */}
      <div
        className="flex items-center gap-3 px-5 py-3.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={iconBg}
        >
          {icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      </div>
      {/* Content */}
      <div className="px-5 py-4 space-y-3">{children}</div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  dim,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
  dim?: boolean
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-36 shrink-0 text-xs text-muted-foreground/70 pt-0.5">
        {label}
      </span>
      <span
        className={[
          "text-sm min-w-0 flex-1",
          mono ? "font-mono text-xs" : "",
          dim ? "text-muted-foreground/60" : "text-foreground",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </span>
    </div>
  )
}
