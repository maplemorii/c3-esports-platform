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
import { buttonVariants } from "@/components/ui/button-variants"

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
    <section className="rounded-xl border border-brand/20 bg-brand/5 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Rocket className="h-4 w-4 text-brand" />
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-brand">
            Getting Started
          </h2>
        </div>
        {/* Progress indicator */}
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full transition-colors",
                s.done ? "bg-brand" : "bg-brand/20"
              )}
            />
          ))}
          <span className="ml-1 text-xs text-brand font-semibold">
            {doneCount}/{steps.length}
          </span>
        </div>
      </div>

      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li
            key={i}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4 transition-colors",
              step.done
                ? "border-emerald-500/20 bg-emerald-500/5 opacity-60"
                : "border-border bg-card"
            )}
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
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "shrink-0 text-xs gap-1"
                )}
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
