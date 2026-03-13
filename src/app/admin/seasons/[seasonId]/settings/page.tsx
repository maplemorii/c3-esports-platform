/**
 * /admin/seasons/:seasonId/settings
 *
 * Edit season status, visibility, dates, and configuration.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight, Settings2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { SeasonEditForm } from "@/components/season/SeasonEditForm"

type Params = { params: Promise<{ seasonId: string }> }

async function getSeason(seasonId: string) {
  return prisma.season.findUnique({
    where:  { id: seasonId },
    select: {
      id:                   true,
      name:                 true,
      slug:                 true,
      status:               true,
      description:          true,
      isVisible:            true,
      startDate:            true,
      endDate:              true,
      registrationStart:    true,
      registrationEnd:      true,
      rosterLockAt:         true,
      leagueWeeks:          true,
      checkInWindowMinutes: true,
      checkInGraceMinutes:  true,
      resultWindowHours:    true,
      maxTeamsTotal:        true,
    },
  })
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { seasonId } = await params
  const season = await getSeason(seasonId)
  return { title: season ? `Settings — ${season.name} — Admin` : "Season Settings" }
}

export default async function SeasonSettingsPage({ params }: Params) {
  const { seasonId } = await params
  const season = await getSeason(seasonId)
  if (!season) notFound()

  // Serialize dates to ISO strings for the client component
  const seasonData = {
    ...season,
    startDate:         season.startDate?.toISOString()         ?? null,
    endDate:           season.endDate?.toISOString()           ?? null,
    registrationStart: season.registrationStart?.toISOString() ?? null,
    registrationEnd:   season.registrationEnd?.toISOString()   ?? null,
    rosterLockAt:      season.rosterLockAt?.toISOString()      ?? null,
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/seasons" className="hover:text-brand transition-colors">
          Seasons
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/admin/seasons/${season.id}`}
          className="hover:text-brand transition-colors truncate max-w-40"
        >
          {season.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Settings</span>
      </nav>

      {/* Header card */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.7), rgba(59,130,246,0.4), transparent)" }}
          aria-hidden
        />
        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.2)" }}
          >
            <Settings2 className="h-5 w-5" style={{ color: "rgba(196,28,53,0.9)" }} />
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: "rgba(196,28,53,0.8)" }}
            >
              Admin · Seasons
            </p>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide">
              Season Settings
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {season.name}
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
      >
        <SeasonEditForm season={seasonData} />
      </div>

    </div>
  )
}
