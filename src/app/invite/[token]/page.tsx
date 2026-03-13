"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, UserRound, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TeamPreview {
  id:              string
  name:            string
  logoUrl:         string | null
  inviteExpiresAt: string
}

type PageState =
  | { status: "loading" }
  | { status: "invalid"; message: string }
  | { status: "ready";   team: TeamPreview }
  | { status: "joining" }
  | { status: "success"; teamId: string; teamName: string }
  | { status: "error";   message: string }

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router    = useRouter()

  const [state, setState] = useState<PageState>({ status: "loading" })

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          setState({ status: "invalid", message: data.error ?? "This invite link is invalid." })
        } else {
          setState({ status: "ready", team: data })
        }
      })
      .catch(() => setState({ status: "invalid", message: "Failed to load invite." }))
  }, [token])

  async function handleJoin() {
    if (state.status !== "ready") return
    const teamId   = state.team.id
    const teamName = state.team.name
    setState({ status: "joining" })

    const res  = await fetch(`/api/invite/${token}`, { method: "POST" })
    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      setState({ status: "success", teamId, teamName })
      setTimeout(() => router.push(`/team/${teamId}`), 2000)
    } else {
      setState({ status: "error", message: data.error ?? "Failed to join the team." })
    }
  }

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Loading */}
        {state.status === "loading" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading invite…</p>
          </div>
        )}

        {/* Invalid / expired */}
        {state.status === "invalid" && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <div>
              <h1 className="font-display text-xl font-black uppercase tracking-wide">
                Invalid Invite
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{state.message}</p>
            </div>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Go Home
            </Link>
          </div>
        )}

        {/* Ready to join */}
        {state.status === "ready" && (
          <div
            className="relative overflow-hidden rounded-2xl bg-card p-8 text-center space-y-6"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.7), rgba(59,130,246,0.4), transparent)" }}
              aria-hidden
            />

            {/* Team logo / fallback */}
            <div className="flex justify-center">
              {state.team.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={state.team.logoUrl}
                  alt={state.team.name}
                  className="h-20 w-20 rounded-xl object-cover border border-border"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-muted">
                  <UserRound className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                You&apos;ve been invited to join
              </p>
              <h1 className="font-display text-3xl font-black uppercase tracking-wide mt-1">
                {state.team.name}
              </h1>
              <p className="mt-2 text-xs text-muted-foreground">
                Invite expires{" "}
                {new Date(state.team.inviteExpiresAt).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </p>
            </div>

            <button
              onClick={handleJoin}
              className={cn(buttonVariants({ size: "lg" }), "w-full")}
            >
              Join Team
            </button>

            <p className="text-xs text-muted-foreground">
              You need a player profile to join.{" "}
              <Link href="/profile/setup" className="underline hover:text-foreground transition-colors">
                Set one up
              </Link>
            </p>
          </div>
        )}

        {/* Joining */}
        {state.status === "joining" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Joining team…</p>
          </div>
        )}

        {/* Success */}
        {state.status === "success" && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
            <div>
              <h1 className="font-display text-xl font-black uppercase tracking-wide">
                You&apos;re on the team!
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Welcome to {state.teamName}. Redirecting…
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-4">
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <div>
              <h1 className="font-display text-xl font-black uppercase tracking-wide">
                Couldn&apos;t Join
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{state.message}</p>
            </div>
            <div className="flex justify-center gap-2">
              <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Go Home
              </Link>
              <Link
                href="/profile/setup"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Set Up Profile
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
