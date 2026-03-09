"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import {
  TeamRegistrationForm,
  type RegistrationSeason,
  type ExistingRegistration,
} from "@/components/team/TeamRegistrationForm"
import type { DivisionTier, RegistrationStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamInfo {
  id:           string
  name:         string
  logoUrl:      string | null
  primaryColor: string | null
  ownerId:      string
}

interface RawRegistration {
  id:           string
  status:       RegistrationStatus
  notes:        string | null
  registeredAt: string
  division:     { id: string; name: string; tier: DivisionTier } | null
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamRegisterPage() {
  const params = useParams<{ teamId: string }>()
  const teamId = params.teamId
  const router = useRouter()

  const [team,          setTeam]          = useState<TeamInfo | null>(null)
  const [openSeasons,   setOpenSeasons]   = useState<RegistrationSeason[]>([])
  const [registrations, setRegistrations] = useState<Record<string, ExistingRegistration | null>>({})
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [teamRes, seasonsRes] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch("/api/seasons?status=REGISTRATION"),
      ])

      if (!teamRes.ok) { router.replace(`/team/${teamId}`); return }
      const teamData = await teamRes.json()
      setTeam({
        id:           teamData.id,
        name:         teamData.name,
        logoUrl:      teamData.logoUrl,
        primaryColor: teamData.primaryColor,
        ownerId:      teamData.ownerId,
      })

      if (!seasonsRes.ok) { setOpenSeasons([]); return }
      const seasons: RegistrationSeason[] = await seasonsRes.json()
      setOpenSeasons(seasons)

      // Fetch this team's registrations for each open season in parallel
      const regResults = await Promise.all(
        seasons.map((s) =>
          fetch(`/api/seasons/${s.id}/registrations?teamId=${teamId}`)
            .then((r) => r.ok ? r.json() : [])
            .then((data: unknown) => {
              const list = Array.isArray(data) ? (data as RawRegistration[]) : []
              const active = list.find((r) => r.status !== "WITHDRAWN") ?? null
              return [s.id, active] as [string, ExistingRegistration | null]
            })
        )
      )
      setRegistrations(Object.fromEntries(regResults))
    } catch {
      setError("Failed to load registration data")
    } finally {
      setLoading(false)
    }
  }, [teamId, router])

  useEffect(() => { load() }, [load])

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
        <p>{error ?? "Team not found"}</p>
        <button
          onClick={() => router.back()}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/team/${teamId}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit -ml-2 gap-1.5 text-muted-foreground mb-2"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {team.name}
        </Link>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Season Registration
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose a division and register your team for the current season.
        </p>
      </div>

      {openSeasons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
            <Trophy className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-medium">No seasons open for registration</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Check back when the next season opens.
            </p>
          </div>
          <Link
            href={`/team/${teamId}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1")}
          >
            Back to Team
          </Link>
        </div>
      ) : (
        openSeasons.map((season) => (
          <TeamRegistrationForm
            key={season.id}
            teamId={teamId}
            season={season}
            registration={registrations[season.id] ?? null}
            onMutate={load}
          />
        ))
      )}
    </div>
  )
}
