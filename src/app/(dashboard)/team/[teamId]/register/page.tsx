"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  Trophy,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Swords,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import type { DivisionTier, RegistrationStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Division {
  id:          string
  name:        string
  tier:        DivisionTier
  description: string | null
  maxTeams:    number | null
  _count:      { registrations: number }
}

interface Season {
  id:                string
  slug:              string
  name:              string
  status:            string
  description:       string | null
  registrationEnd:   string | null
  startDate:         string | null
  divisions:         Division[]
}

interface Registration {
  id:           string
  status:       RegistrationStatus
  registeredAt: string
  division:     { id: string; name: string; tier: DivisionTier } | null
  season:       { id: string; name: string }
}

interface TeamInfo {
  id:           string
  name:         string
  logoUrl:      string | null
  primaryColor: string | null
  ownerId:      string
}

// ---------------------------------------------------------------------------
// Division metadata
// ---------------------------------------------------------------------------

const TIER_META: Record<DivisionTier, {
  label: string
  desc:  string
  icon:  React.ElementType
  color: string
  ring:  string
  badge: string
}> = {
  PREMIER: {
    label: "Premier",
    desc:  "Top tier. The highest level of competition in the league.",
    icon:  Star,
    color: "text-yellow-400",
    ring:  "ring-yellow-400/40",
    badge: "bg-yellow-400/15 text-yellow-400 border-yellow-400/30",
  },
  CHALLENGERS: {
    label: "Open Challengers",
    desc:  "Upper open bracket. Competitive play for experienced teams.",
    icon:  Swords,
    color: "text-sky-400",
    ring:  "ring-sky-400/40",
    badge: "bg-sky-400/15 text-sky-400 border-sky-400/30",
  },
  CONTENDERS: {
    label: "Open Contenders",
    desc:  "Entry-level open bracket. Great starting point for new teams.",
    icon:  ShieldCheck,
    color: "text-emerald-400",
    ring:  "ring-emerald-400/40",
    badge: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30",
  },
}

const STATUS_META: Record<RegistrationStatus, { label: string; icon: React.ElementType; className: string }> = {
  PENDING:    { label: "Pending Review",  icon: Clock,          className: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
  APPROVED:   { label: "Approved",        icon: CheckCircle2,   className: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  REJECTED:   { label: "Rejected",        icon: XCircle,        className: "text-destructive border-destructive/30 bg-destructive/10" },
  WAITLISTED: { label: "Waitlisted",      icon: AlertCircle,    className: "text-orange-400 border-orange-400/30 bg-orange-400/10" },
  WITHDRAWN:  { label: "Withdrawn",       icon: XCircle,        className: "text-muted-foreground border-border bg-muted/30" },
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamRegisterPage() {
  const params = useParams<{ teamId: string }>()
  const teamId = params.teamId
  const router = useRouter()

  const [team,           setTeam]           = useState<TeamInfo | null>(null)
  const [openSeasons,    setOpenSeasons]     = useState<Season[]>([])
  const [registrations,  setRegistrations]   = useState<Registration[]>([])
  const [loading,        setLoading]         = useState(true)
  const [error,          setError]           = useState<string | null>(null)

  // Per-season selection state
  const [selectedDiv,    setSelectedDiv]     = useState<Record<string, string>>({})

  // Submission state
  const [submitting,     setSubmitting]      = useState<string | null>(null) // seasonId being submitted
  const [withdrawing,    setWithdrawing]     = useState<string | null>(null) // regId being withdrawn
  const [submitError,    setSubmitError]     = useState<string | null>(null)

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
      setTeam({ id: teamData.id, name: teamData.name, logoUrl: teamData.logoUrl, primaryColor: teamData.primaryColor, ownerId: teamData.ownerId })

      if (!seasonsRes.ok) { setOpenSeasons([]); return }

      const seasons: Season[] = await seasonsRes.json()
      setOpenSeasons(seasons)

      // Default division selection: CONTENDERS tier if present, else last in list
      const init: Record<string, string> = {}
      for (const s of seasons) {
        if (s.divisions.length > 0) {
          const contenders = s.divisions.find((d) => d.tier === "CONTENDERS")
          init[s.id] = contenders?.id ?? s.divisions[s.divisions.length - 1].id
        }
      }
      setSelectedDiv(init)

      // Fetch this team's registrations for each open season in parallel
      const regResults = await Promise.all(
        seasons.map((s) =>
          fetch(`/api/seasons/${s.id}/registrations?teamId=${teamId}`)
            .then((r) => r.ok ? r.json() : [])
            .then((data: unknown) =>
              (Array.isArray(data) ? data as Registration[] : []).map((reg) => ({
                ...reg,
                season: { id: s.id, name: s.name },
              }))
            )
        )
      )
      setRegistrations(regResults.flat())
    } catch {
      setError("Failed to load registration data")
    } finally {
      setLoading(false)
    }
  }, [teamId, router])

  useEffect(() => { load() }, [load])

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  async function handleRegister(seasonId: string) {
    const divisionId = selectedDiv[seasonId]
    if (!divisionId) return

    setSubmitError(null)
    setSubmitting(seasonId)
    try {
      const res = await fetch(`/api/seasons/${seasonId}/registrations`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ teamId, divisionId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSubmitError(data?.error ?? "Registration failed. Please try again.")
        return
      }
      await load()
    } finally {
      setSubmitting(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Withdraw
  // ---------------------------------------------------------------------------

  async function handleWithdraw(seasonId: string, regId: string) {
    setSubmitError(null)
    setWithdrawing(regId)
    try {
      const res = await fetch(`/api/seasons/${seasonId}/registrations/${regId}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSubmitError(data?.error ?? "Failed to withdraw registration.")
        return
      }
      await load()
    } finally {
      setWithdrawing(null)
    }
  }

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
        <button onClick={() => router.back()} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
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
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit -ml-2 gap-1.5 text-muted-foreground mb-2")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {team.name}
        </Link>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Season Registration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Choose a division and register your team for the current season.
        </p>
      </div>

      {submitError && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {submitError}
        </p>
      )}

      {openSeasons.length === 0 ? (
        /* No open seasons */
        <div className="rounded-xl border border-dashed border-border bg-card flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
            <Trophy className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-medium">No seasons open for registration</p>
            <p className="text-xs text-muted-foreground mt-0.5">Check back when the next season opens.</p>
          </div>
          <Link href={`/team/${teamId}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1")}>
            Back to Team
          </Link>
        </div>
      ) : (
        openSeasons.map((season) => {
          const existingReg = registrations.find(
            (r) => r.season.id === season.id && r.status !== "WITHDRAWN"
          )

          return (
            <section key={season.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Season header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10 shrink-0">
                  <Trophy className="h-4 w-4 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    {season.name}
                  </h2>
                  {season.registrationEnd && (
                    <p className="text-xs text-muted-foreground/60">
                      Registration closes {new Date(season.registrationEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">

                {/* Already registered */}
                {existingReg ? (
                  <ExistingRegistration
                    reg={existingReg}
                    onWithdraw={(regId) => handleWithdraw(season.id, regId)}
                    withdrawing={withdrawing}
                  />
                ) : (
                  /* Division selector */
                  <>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                        Choose your division
                      </p>
                      <div className="flex flex-col gap-3">
                        {season.divisions.map((div) => {
                          const meta   = TIER_META[div.tier]
                          const Icon   = meta.icon
                          const sel    = selectedDiv[season.id] === div.id
                          const spots  = div.maxTeams != null
                            ? div.maxTeams - div._count.registrations
                            : null
                          const full   = spots !== null && spots <= 0

                          return (
                            <button
                              key={div.id}
                              type="button"
                              disabled={full}
                              onClick={() => !full && setSelectedDiv((prev) => ({ ...prev, [season.id]: div.id }))}
                              className={cn(
                                "flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                                full
                                  ? "opacity-40 cursor-not-allowed border-border"
                                  : "cursor-pointer hover:border-brand/40",
                                sel && !full
                                  ? cn("ring-2 border-brand/40 bg-brand/5", meta.ring)
                                  : "border-border bg-transparent"
                              )}
                            >
                              {/* Tier icon */}
                              <div className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                                sel ? "border-current/30 bg-current/10" : "border-border bg-muted"
                              )}>
                                <Icon className={cn("h-5 w-5", sel ? meta.color : "text-muted-foreground/50")} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={cn("font-display text-sm font-bold uppercase tracking-wide", sel ? meta.color : "text-foreground")}>
                                    {div.name}
                                  </span>
                                  <span className={cn(
                                    "inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-semibold uppercase tracking-widest",
                                    meta.badge
                                  )}>
                                    {meta.label}
                                  </span>
                                  {full && (
                                    <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-widest text-destructive">
                                      Full
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>
                                {div.maxTeams != null && (
                                  <p className="text-xs text-muted-foreground/60 mt-1">
                                    {full
                                      ? "No spots remaining"
                                      : `${spots} of ${div.maxTeams} spots remaining`}
                                  </p>
                                )}
                              </div>

                              {/* Radio indicator */}
                              {!full && (
                                <div className={cn(
                                  "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                                  sel
                                    ? "border-brand bg-brand"
                                    : "border-muted-foreground/30 bg-transparent"
                                )} />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Register button */}
                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Registration is pending staff approval. You will be notified of the decision.
                      </p>
                      <button
                        type="button"
                        disabled={!selectedDiv[season.id] || submitting === season.id}
                        onClick={() => handleRegister(season.id)}
                        className={cn(buttonVariants({ size: "sm" }), "shrink-0 gap-1.5")}
                      >
                        {submitting === season.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <ChevronRight className="h-3.5 w-3.5" />}
                        {submitting === season.id ? "Registering…" : "Register"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExistingRegistration — shows current status + withdraw option
// ---------------------------------------------------------------------------

function ExistingRegistration({
  reg,
  onWithdraw,
  withdrawing,
}: {
  reg:        Registration
  onWithdraw: (regId: string) => void
  withdrawing: string | null
}) {
  const meta   = STATUS_META[reg.status]
  const Icon   = meta.icon
  const divMeta = reg.division ? TIER_META[reg.division.tier] : null

  const canWithdraw = reg.status === "PENDING" || reg.status === "WAITLISTED"

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3",
        meta.className
      )}>
        <Icon className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{meta.label}</p>
          {reg.status === "PENDING" && (
            <p className="text-xs opacity-70 mt-0.5">
              Your registration is being reviewed by staff.
            </p>
          )}
          {reg.status === "APPROVED" && (
            <p className="text-xs opacity-70 mt-0.5">
              Your team has been approved and is set to compete.
            </p>
          )}
          {reg.status === "REJECTED" && (
            <p className="text-xs opacity-70 mt-0.5">
              Your registration was not accepted. Contact staff for details.
            </p>
          )}
          {reg.status === "WAITLISTED" && (
            <p className="text-xs opacity-70 mt-0.5">
              You are on the waitlist. You may be added if spots open up.
            </p>
          )}
        </div>
      </div>

      {/* Division info */}
      {reg.division && divMeta && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
          <divMeta.icon className={cn("h-4 w-4 shrink-0", divMeta.color)} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{reg.division.name}</p>
            <p className="text-xs text-muted-foreground">{divMeta.desc}</p>
          </div>
          <span className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest shrink-0",
            divMeta.badge
          )}>
            {divMeta.label}
          </span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Registered {new Date(reg.registeredAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </p>

      {/* Withdraw */}
      {canWithdraw && (
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Withdrawing will cancel your registration. You can re-register while the season is open.
          </p>
          <button
            type="button"
            disabled={withdrawing === reg.id}
            onClick={() => onWithdraw(reg.id)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1.5 text-destructive hover:text-destructive hover:border-destructive/50")}
          >
            {withdrawing === reg.id
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : null}
            {withdrawing === reg.id ? "Withdrawing…" : "Withdraw"}
          </button>
        </div>
      )}
    </div>
  )
}
