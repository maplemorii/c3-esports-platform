/**
 * /(dashboard)/profile/setup
 *
 * First-time player profile creation page.
 * Server component — redirects to /profile if profile already exists.
 * Renders PlayerProfileForm (client) for the actual form.
 */

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Rocket, Gamepad2, Users, Trophy } from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { SetupFormWrapper } from "./SetupFormWrapper"

export const metadata: Metadata = { title: "Set Up Your Profile" }

export default async function ProfileSetupPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  // If they already have a profile, send them to the profile view
  const existing = await prisma.player.findUnique({
    where:  { userId: session.user.id },
    select: { id: true },
  })
  if (existing) redirect("/profile")

  return (
    <div className="min-h-full flex flex-col items-center justify-start py-12 px-4">
      <div className="w-full max-w-xl">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          {/* Icon badge */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/30 bg-brand/10">
            <Rocket className="h-7 w-7 text-brand" />
          </div>

          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Set Up Your Profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Create your player identity for the Carolina Collegiate Clash. Your display name
            and Epic username help coaches and teammates find you.
          </p>
        </div>

        {/* ── Progress breadcrumb ───────────────────────────────────────── */}
        <div className="mb-8 flex items-center justify-center gap-0">
          <Step num={1} label="Profile" active />
          <Connector />
          <Step num={2} label="Team" />
          <Connector />
          <Step num={3} label="Register" />
        </div>

        {/* ── Benefits strip ────────────────────────────────────────────── */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          <BenefitTile icon={<Gamepad2 className="h-4 w-4" />} label="Link your Epic account" />
          <BenefitTile icon={<Users className="h-4 w-4" />}    label="Join or create teams" />
          <BenefitTile icon={<Trophy className="h-4 w-4" />}   label="Compete this season" />
        </div>

        {/* ── Form card ────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <SetupFormWrapper />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          You can edit any of these details later from your profile page.
        </p>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Step({ num, label, active }: { num: number; label: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={
          active
            ? "flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
            : "flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-xs font-medium text-muted-foreground"
        }
      >
        {num}
      </div>
      <span className={`text-[10px] font-semibold uppercase tracking-widest ${active ? "text-brand" : "text-muted-foreground/50"}`}>
        {label}
      </span>
    </div>
  )
}

function Connector() {
  return (
    <div className="h-px w-10 bg-border mx-1 mb-5" />
  )
}

function BenefitTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card/50 px-3 py-3 text-center">
      <span className="text-brand">{icon}</span>
      <span className="text-[11px] text-muted-foreground leading-snug">{label}</span>
    </div>
  )
}
