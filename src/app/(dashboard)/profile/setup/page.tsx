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
          {/* Icon badge with gradient ring */}
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(196,28,53,0.1)",
              border: "1px solid rgba(196,28,53,0.25)",
              boxShadow: "0 0 0 4px rgba(196,28,53,0.08), 0 0 20px rgba(196,28,53,0.15)",
            }}
          >
            <Rocket className="h-8 w-8 text-brand" />
          </div>

          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground">
            Set Up Your Profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
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
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6">
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
            aria-hidden
          />
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
        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
        style={
          active
            ? {
                background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))",
                color: "white",
                boxShadow: "0 0 10px rgba(196,28,53,0.3)",
              }
            : {
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.3)",
              }
        }
      >
        {num}
      </div>
      <span
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: active ? "rgba(196,28,53,0.85)" : "rgba(255,255,255,0.25)" }}
      >
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
    <div
      className="flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{
          background: "rgba(196,28,53,0.12)",
          border: "1px solid rgba(196,28,53,0.2)",
          color: "rgba(196,28,53,0.85)",
        }}
      >
        {icon}
      </div>
      <span className="text-[11px] text-muted-foreground/70 leading-snug">{label}</span>
    </div>
  )
}
