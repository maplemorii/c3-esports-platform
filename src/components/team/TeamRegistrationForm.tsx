/**
 * TeamRegistrationForm
 *
 * Self-contained client component for registering a team into a season.
 * Handles division selection, submission, status display, and withdrawal.
 *
 * Usage:
 *   <TeamRegistrationForm teamId={teamId} season={season} registration={reg} onMutate={load} />
 */

"use client"

import { useState } from "react"
import {
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

export interface RegistrationDivision {
  id:          string
  name:        string
  tier:        DivisionTier
  description: string | null
  maxTeams:    number | null
  _count:      { registrations: number }
}

export interface RegistrationSeason {
  id:              string
  name:            string
  registrationEnd: string | null
  divisions:       RegistrationDivision[]
}

export interface ExistingRegistration {
  id:           string
  status:       RegistrationStatus
  notes:        string | null
  registeredAt: string
  division:     { id: string; name: string; tier: DivisionTier } | null
}

// ---------------------------------------------------------------------------
// Tier metadata
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

const STATUS_META: Record<RegistrationStatus, {
  label:     string
  icon:      React.ElementType
  className: string
}> = {
  PENDING:    { label: "Pending Review",  icon: Clock,         className: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10" },
  APPROVED:   { label: "Approved",        icon: CheckCircle2,  className: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  REJECTED:   { label: "Rejected",        icon: XCircle,       className: "text-destructive border-destructive/30 bg-destructive/10" },
  WAITLISTED: { label: "Waitlisted",      icon: AlertCircle,   className: "text-orange-400 border-orange-400/30 bg-orange-400/10" },
  WITHDRAWN:  { label: "Withdrawn",       icon: XCircle,       className: "text-muted-foreground border-border bg-muted/30" },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TeamRegistrationFormProps {
  teamId:       string
  season:       RegistrationSeason
  registration: ExistingRegistration | null
  onMutate:     () => Promise<void> | void
}

export function TeamRegistrationForm({
  teamId,
  season,
  registration,
  onMutate,
}: TeamRegistrationFormProps) {
  // Default division to CONTENDERS if available
  const defaultDiv =
    season.divisions.find((d) => d.tier === "CONTENDERS")?.id ??
    season.divisions[season.divisions.length - 1]?.id ??
    ""

  const [selectedDivId, setSelectedDivId] = useState(defaultDiv)
  const [submitting,    setSubmitting]    = useState(false)
  const [withdrawing,   setWithdrawing]   = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [reregistering, setReregistering] = useState(false)

  // Treat WITHDRAWN and REJECTED (when user clicks re-register) as "no active reg"
  const existingReg =
    registration?.status === "WITHDRAWN" ||
    (registration?.status === "REJECTED" && reregistering)
      ? null
      : registration

  // ── Register ──────────────────────────────────────────────────────────────

  async function handleRegister() {
    if (!selectedDivId) return
    setError(null)
    setSubmitting(true)
    try {
      const res  = await fetch(`/api/seasons/${season.id}/registrations`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ teamId, divisionId: selectedDivId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? "Registration failed. Please try again.")
        return
      }
      await onMutate()
    } finally {
      setSubmitting(false)
    }
  }

  // ── Withdraw ──────────────────────────────────────────────────────────────

  async function handleWithdraw() {
    if (!existingReg) return
    setError(null)
    setWithdrawing(true)
    try {
      const res  = await fetch(`/api/seasons/${season.id}/registrations/${existingReg.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? "Failed to withdraw registration.")
        return
      }
      await onMutate()
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
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
              Registration closes{" "}
              {new Date(season.registrationEnd).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        {existingReg ? (
          /* Already registered — show status + optional withdraw/re-register */
          <ExistingRegistrationView
            reg={existingReg}
            onWithdraw={handleWithdraw}
            withdrawing={withdrawing}
            onReregister={() => setReregistering(true)}
          />
        ) : (
          /* Division selector + submit */
          <>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
                Choose your division
              </p>
              <div className="flex flex-col gap-3">
                {season.divisions.map((div) => {
                  const meta  = TIER_META[div.tier]
                  const Icon  = meta.icon
                  const sel   = selectedDivId === div.id
                  const spots = div.maxTeams != null
                    ? div.maxTeams - div._count.registrations
                    : null
                  const full  = spots !== null && spots <= 0

                  return (
                    <button
                      key={div.id}
                      type="button"
                      disabled={full}
                      onClick={() => !full && setSelectedDivId(div.id)}
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
                      {/* Icon */}
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                        sel ? "border-current/30 bg-current/10" : "border-border bg-muted"
                      )}>
                        <Icon className={cn("h-5 w-5", sel ? meta.color : "text-muted-foreground/50")} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "font-display text-sm font-bold uppercase tracking-wide",
                            sel ? meta.color : "text-foreground"
                          )}>
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

            <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Registration is pending staff approval.
              </p>
              <button
                type="button"
                disabled={!selectedDivId || submitting}
                onClick={handleRegister}
                className={cn(buttonVariants({ size: "sm" }), "shrink-0 gap-1.5")}
              >
                {submitting
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <ChevronRight className="h-3.5 w-3.5" />}
                {submitting ? "Registering…" : "Register"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// ExistingRegistrationView
// ---------------------------------------------------------------------------

function ExistingRegistrationView({
  reg,
  onWithdraw,
  withdrawing,
  onReregister,
}: {
  reg:          ExistingRegistration
  onWithdraw:   () => void
  withdrawing:  boolean
  onReregister: () => void
}) {
  const meta    = STATUS_META[reg.status]
  const Icon    = meta.icon
  const divMeta = reg.division ? TIER_META[reg.division.tier] : null
  const canWithdraw    = reg.status === "PENDING" || reg.status === "WAITLISTED"
  const canReregister  = reg.status === "REJECTED"

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", meta.className)}>
        <Icon className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{meta.label}</p>
          {reg.status === "PENDING" && (
            <p className="text-xs opacity-70 mt-0.5">Your registration is being reviewed by staff.</p>
          )}
          {reg.status === "APPROVED" && (
            <p className="text-xs opacity-70 mt-0.5">Your team has been approved and is set to compete.</p>
          )}
          {reg.status === "REJECTED" && (
            <p className="text-xs opacity-70 mt-0.5">
              {reg.notes
                ? <>Staff note: <span className="font-medium">{reg.notes}</span></>
                : "Your registration was not accepted."}
            </p>
          )}
          {reg.status === "WAITLISTED" && (
            <p className="text-xs opacity-70 mt-0.5">You are on the waitlist. You may be added if spots open up.</p>
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
        Registered{" "}
        {new Date(reg.registeredAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>

      {canReregister && (
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            You can update your application and re-submit while registration is open.
          </p>
          <button
            type="button"
            onClick={onReregister}
            className={cn(buttonVariants({ size: "sm" }), "shrink-0 gap-1.5")}
          >
            Re-register
          </button>
        </div>
      )}

      {canWithdraw && (
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Withdrawing will cancel your registration. You can re-register while the season is open.
          </p>
          <button
            type="button"
            disabled={withdrawing}
            onClick={onWithdraw}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "shrink-0 gap-1.5 text-destructive hover:text-destructive hover:border-destructive/50"
            )}
          >
            {withdrawing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {withdrawing ? "Withdrawing…" : "Withdraw"}
          </button>
        </div>
      )}
    </div>
  )
}
