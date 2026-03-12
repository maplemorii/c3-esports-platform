/**
 * OnboardingChecklist
 *
 * Progress checklist for new users shown on dashboard + profile.
 * Auto-hides when all three steps are complete.
 *
 * Steps: create profile → join/create team → register for season
 *
 * Usage:
 *   <OnboardingChecklist
 *     hasProfile={!!player}
 *     hasTeam={teams.length > 0}
 *     hasRegistration={hasActiveReg}
 *     registerHref="/team/cuid/register"
 *   />
 */

import Link from "next/link"
import { CheckCircle2, Circle, ChevronRight, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"

interface OnboardingChecklistProps {
  hasProfile:      boolean
  hasTeam:         boolean
  hasRegistration: boolean
  registerHref?:   string  // defaults to /team if no team; team register link if team exists
}

export function OnboardingChecklist({
  hasProfile,
  hasTeam,
  hasRegistration,
  registerHref,
}: OnboardingChecklistProps) {
  const allDone = hasProfile && hasTeam && hasRegistration
  if (allDone) return null

  const steps = [
    {
      done:  hasProfile,
      label: "Create your player profile",
      desc:  "Set your display name and Epic username so teammates can find you.",
      href:  "/profile/setup",
      cta:   "Set up profile",
    },
    {
      done:  hasTeam,
      label: "Join or create a team",
      desc:  "Own a team or ask a captain to add you to their roster.",
      href:  "/team/create",
      cta:   "Create team",
    },
    {
      done:  hasRegistration,
      label: "Register for the season",
      desc:  "Submit your team for staff review to compete this season.",
      href:  registerHref ?? "/team",
      cta:   "Register now",
    },
  ]

  const doneCount = steps.filter((s) => s.done).length

  return (
    <section
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: "rgba(196,28,53,0.04)",
        border: "1px solid rgba(196,28,53,0.12)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
        aria-hidden
      />
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-brand" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-brand">
            Getting Started
          </h2>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="relative h-1.5 w-20 rounded-full overflow-hidden bg-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: `${(doneCount / steps.length) * 100}%`,
                background: "linear-gradient(90deg, rgba(196,28,53,0.8), rgba(59,130,246,0.8))",
              }}
            />
          </div>
          <span className="text-xs font-bold text-brand">{doneCount}/{steps.length}</span>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-xl p-4"
            style={{
              background: step.done ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${step.done ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)"}`,
              opacity: step.done ? 0.55 : 1,
            }}
          >
            <div className="mt-0.5 shrink-0">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                step.done && "line-through text-muted-foreground"
              )}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
              )}
            </div>

            {!step.done && (
              <Link
                href={step.href}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
                style={{
                  background: "rgba(196,28,53,0.15)",
                  border: "1px solid rgba(196,28,53,0.25)",
                  color: "rgba(252,165,165,0.85)",
                }}
              >
                {step.cta}
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
