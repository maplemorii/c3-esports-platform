/**
 * /admin/seasons/:seasonId/settings
 *
 * Edit season status, visibility, dates, and configuration.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronRight } from "lucide-react"
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
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/seasons" className="hover:text-brand transition-colors">
          Seasons
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">{season.name}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Settings</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
          Season Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage status, visibility, dates, and configuration for{" "}
          <span className="font-medium text-foreground">{season.name}</span>.
        </p>
      </div>

      <SeasonEditForm season={seasonData} />

    </div>
  )
}
