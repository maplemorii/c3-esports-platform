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
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/team" className="hover:text-brand transition-colors">My Teams</Link>
        <span className="opacity-40">/</span>
        <Link href={`/team/${teamId}`} className="hover:text-brand transition-colors truncate max-w-40">{team.name}</Link>
        <span className="opacity-40">/</span>
        <span className="text-foreground">Register</span>
      </div>

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
            <Trophy className="h-5 w-5" style={{ color: "rgba(196,28,53,0.9)" }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "rgba(196,28,53,0.8)" }}>
              {team.name}
            </p>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide">
              Season Registration
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Choose a division and register your team for the current season.
            </p>
          </div>
        </div>
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
