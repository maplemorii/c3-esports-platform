/**
 * /players
 *
 * Public player directory — all active players with their current team,
 * division, and display name. Searchable by name.
 */

import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Search, UserCircle } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import type { DivisionTier } from "@prisma/client"

export const metadata: Metadata = {
  title: "Players — C3 Esports",
  description: "Browse all players competing in the C3 Esports collegiate league.",
}
export const dynamic = "force-dynamic"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PlayerRow = {
  id:          string
  displayName: string
  avatarUrl:   string | null
  bio:         string | null
  discordUsername: string | null
  memberships: {
    role: string
    team: {
      id:           string
      name:         string
      slug:         string
      logoUrl:      string | null
      primaryColor: string | null
    }
    activeDivision: {
      name: string
      tier: DivisionTier
      season: { name: string }
    } | null
  }[]
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getPlayers(search: string): Promise<PlayerRow[]> {
  return prisma.player.findMany({
    where: {
      deletedAt: null,
      memberships: { some: { leftAt: null } },
      ...(search ? { displayName: { contains: search, mode: "insensitive" } } : {}),
    },
    orderBy: { displayName: "asc" },
    select: {
      id:              true,
      displayName:     true,
      avatarUrl:       true,
      bio:             true,
      discordUsername: true,
      memberships: {
        where:   { leftAt: null },
        take:    1,
        select: {
          role: true,
          team: {
            select: {
              id:           true,
              name:         true,
              slug:         true,
              logoUrl:      true,
              primaryColor: true,
            },
          },
          activeDivision: {
            select: {
              name:   true,
              tier:   true,
              season: { select: { name: true } },
            },
          },
        },
      },
    },
  }) as unknown as PlayerRow[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_COLOR: Record<DivisionTier, string> = {
  PREMIER:     "text-amber-400 bg-amber-400/10 border-amber-400/25",
  CHALLENGERS: "text-blue-400  bg-blue-400/10  border-blue-400/25",
  CONTENDERS:  "text-cyan-400  bg-cyan-400/10  border-cyan-400/25",
}

const ROLE_LABEL: Record<string, string> = {
  CAPTAIN: "Captain",
  PLAYER:  "Player",
  SUB:     "Sub",
}

// ---------------------------------------------------------------------------
// Player card
// ---------------------------------------------------------------------------
function PlayerCard({ player }: { player: PlayerRow }) {
  const membership = player.memberships[0]
  const team       = membership?.team
  const division   = membership?.activeDivision
  const initials   = player.displayName.slice(0, 2).toUpperCase()

  return (
    <div
      className="flex flex-col rounded-xl border transition-colors duration-150 overflow-hidden group"
      style={{ background: "rgba(255,255,255,0.025)", borderColor: "rgba(255,255,255,0.07)" }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background   = "rgba(255,255,255,0.05)"
        ;(e.currentTarget as HTMLElement).style.borderColor  = "rgba(255,255,255,0.12)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background   = "rgba(255,255,255,0.025)"
        ;(e.currentTarget as HTMLElement).style.borderColor  = "rgba(255,255,255,0.07)"
      }}
    >
      {/* Top accent strip using team color */}
      <div
        className="h-1 w-full shrink-0"
        style={{ background: team?.primaryColor
          ? `linear-gradient(90deg, ${team.primaryColor}, transparent)`
          : "linear-gradient(90deg, rgba(196,28,53,0.4), rgba(59,130,246,0.2), transparent)"
        }}
      />

      <div className="flex items-start gap-3 p-4">
        {/* Avatar */}
        {player.avatarUrl ? (
          <Image
            src={player.avatarUrl}
            alt={player.displayName}
            width={44}
            height={44}
            className="rounded-full object-cover shrink-0 ring-2 ring-white/8"
            style={{ height: "44px", width: "44px" }}
          />
        ) : (
          <div
            className="h-11 w-11 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/8"
            style={{ background: "linear-gradient(135deg, rgba(196,28,53,0.7), rgba(59,130,246,0.6))" }}
          >
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white/90 truncate group-hover:text-white transition-colors">
            {player.displayName}
          </p>

          {membership && (
            <p className="text-[11px] text-white/40 mt-0.5">
              {ROLE_LABEL[membership.role] ?? membership.role}
            </p>
          )}

          {player.bio && (
            <p className="text-xs text-white/30 mt-1.5 line-clamp-2 leading-relaxed">
              {player.bio}
            </p>
          )}
        </div>
      </div>

      {/* Team + division footer */}
      {team && (
        <div
          className="flex items-center justify-between gap-2 px-4 py-2.5 mt-auto"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.15)" }}
        >
          <Link
            href={`/teams/${team.slug}`}
            className="flex items-center gap-2 min-w-0 group/team"
          >
            {team.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={team.logoUrl}
                alt={team.name}
                className="h-5 w-5 rounded object-cover shrink-0"
              />
            ) : (
              <div
                className="h-5 w-5 shrink-0 rounded flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
              >
                {team.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-white/55 truncate group-hover/team:text-white/80 transition-colors">
              {team.name}
            </span>
          </Link>

          {division && (
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0",
              TIER_COLOR[division.tier]
            )}>
              {division.tier === "PREMIER" ? "Premier" : division.tier === "CHALLENGERS" ? "Challengers" : "Contenders"}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = "" } = await searchParams
  const players = await getPlayers(q)

  return (
    <div className="relative min-h-screen">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-96 w-96 opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(196,28,53,0.6), transparent 70%)",
          filter:     "blur(80px)",
          transform:  "translate(30%, -20%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: "rgba(196,28,53,0.7)" }}>
            C3 Esports League
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-white sm:text-6xl">
            Players
          </h1>
          <p className="mt-3 text-sm text-white/40">
            {players.length} active player{players.length !== 1 ? "s" : ""} across all divisions
          </p>
          <div
            className="mt-5 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* Search */}
        <form method="GET" className="mb-8">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search players…"
              className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-colors"
              style={{
                background:  "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.09)",
              }}
              onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.22)" }}
              onBlur={(e)  => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.09)" }}
            />
          </div>
        </form>

        {/* Grid */}
        {players.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-32 text-center">
            <div className="rounded-full p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <UserCircle className="h-8 w-8 text-white/20" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/50">
                {q ? `No players matching "${q}"` : "No players yet"}
              </p>
              {q && (
                <Link href="/players" className="mt-1 text-xs text-blue-400/70 hover:text-blue-400 underline underline-offset-2">
                  Clear search
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {players.map((p) => (
              <PlayerCard key={p.id} player={p} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
