/**
 * /(dashboard)/profile/edit
 *
 * Player profile edit page.
 * Server component — loads existing profile, redirects if none exists.
 *
 * Two sections:
 *   1. Profile form  — display name, Discord username, bio
 *   2. Linked accounts — Epic Games + Steam via OAuth (link/unlink)
 */

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, UserRound, Link2, CheckCircle2, XCircle, Gamepad2, Layers } from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { EditFormWrapper } from "./EditFormWrapper"
import { EpicLinkButton } from "@/components/player/EpicLinkButton"
import { SteamLinkButton } from "@/components/player/SteamLinkButton"
import { EduVerificationCard } from "@/components/profile/EduVerificationCard"
import { AvatarUpload } from "@/components/profile/AvatarUpload"

export const metadata: Metadata = { title: "Edit Profile" }

export default async function ProfileEditPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const [player, user] = await Promise.all([
    prisma.player.findUnique({
      where:  { userId: session.user.id, deletedAt: null },
      select: {
        id:              true,
        displayName:     true,
        avatarUrl:       true,
        epicUsername:    true,
        steamId:         true,
        discordUsername: true,
        bio:             true,
      },
    }),
    prisma.user.findUnique({
      where:  { id: session.user.id, deletedAt: null },
      select: {
        image:             true,
        accounts:          { select: { provider: true } },
        eduEmail:          true,
        eduEmailVerified:  true,
        eduVerifyOverride: true,
      },
    }),
  ])

  if (!player) redirect("/profile/setup")

  const eduVerified     = !!(user?.eduEmailVerified || user?.eduVerifyOverride)
  const hasDiscordOAuth = user?.accounts.some((a) => a.provider === "discord") ?? false
  const currentAvatar   = player.avatarUrl ?? user?.image ?? null

  return (
    <div className="min-h-full flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-xl space-y-6">

        {/* ── Back nav ─────────────────────────────────────────────────── */}
        <Link
          href="/profile"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 gap-1.5 text-muted-foreground"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Profile
        </Link>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
            <UserRound className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
              Edit Profile
            </h1>
            <p className="text-xs text-muted-foreground">
              Update your display name, linked accounts, and bio.
            </p>
          </div>
        </div>

        {/* ── Avatar upload ────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center gap-1">
          <p className="self-start text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Profile Photo
          </p>
          <AvatarUpload
            playerId={player.id}
            currentAvatarUrl={currentAvatar}
            hasDiscordOAuth={hasDiscordOAuth}
          />
        </div>

        {/* ── Profile form ─────────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <EditFormWrapper
            playerId={player.id}
            initialValues={{
              displayName:     player.displayName,
              discordUsername: player.discordUsername ?? "",
              bio:             player.bio             ?? "",
            }}
          />
        </div>

        {/* ── Linked accounts ──────────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
            <Link2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Linked Accounts
            </h2>
          </div>

          <div className="divide-y divide-border">
            <LinkedAccountRow
              icon={Gamepad2}
              platform="Epic Games"
              value={player.epicUsername}
              accentClass="text-sky-400"
              description="Your Rocket League / Epic display name — verified via Epic OAuth."
            >
              <EpicLinkButton epicUsername={player.epicUsername} />
            </LinkedAccountRow>

            <LinkedAccountRow
              icon={Layers}
              platform="Steam"
              value={player.steamId}
              accentClass="text-blue-400"
              description="Your SteamID64 — verified via Steam OpenID."
            >
              <SteamLinkButton steamId={player.steamId} />
            </LinkedAccountRow>
          </div>
        </div>

        {/* ── College verification ──────────────────────────────────────── */}
        <EduVerificationCard
          initialEduEmail={user?.eduEmail ?? null}
          initialVerified={eduVerified}
          isOverride={!!(user?.eduVerifyOverride)}
        />

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function LinkedAccountRow({
  icon: Icon,
  platform,
  value,
  accentClass,
  description,
  children,
}: {
  icon:        React.ElementType
  platform:    string
  value:       string | null
  accentClass: string
  description: string
  children:    React.ReactNode
}) {
  const linked = !!value

  return (
    <div className="flex items-start gap-4 p-5">
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border mt-0.5",
        linked ? "border-current/20 bg-current/5" : "border-border bg-muted"
      )}>
        <Icon className={cn("h-4 w-4", linked ? accentClass : "text-muted-foreground/40")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">{platform}</p>
          {linked ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
          )}
        </div>
        {value ? (
          <p className={cn("text-sm font-mono mt-0.5", accentClass)}>{value}</p>
        ) : (
          <p className="text-sm text-muted-foreground/50 mt-0.5">Not linked</p>
        )}
        <p className="text-xs text-muted-foreground/50 mt-1">{description}</p>
        {children}
      </div>
    </div>
  )
}
