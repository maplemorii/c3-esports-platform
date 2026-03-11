"use client"

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { GraduationCap, CheckCircle2, XCircle, Loader2, AlertCircle, MailCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface EduVerificationCardProps {
  /** Current state from the server — passed from the page */
  initialEduEmail: string | null
  initialVerified: boolean  // true if eduEmailVerified is set OR eduVerifyOverride is true
  isOverride: boolean       // true if it was staff-overridden (not email-verified)
}

export function EduVerificationCard({
  initialEduEmail,
  initialVerified,
  isOverride,
}: EduVerificationCardProps) {
  const searchParams = useSearchParams()
  const eduParam = searchParams.get("edu")

  // Optimistically reflect a just-verified state from the redirect param
  const [verified, setVerified] = useState(
    initialVerified || eduParam === "verified"
  )
  const [eduEmail, setEduEmail] = useState(initialEduEmail ?? "")
  const [input, setInput] = useState(initialEduEmail ?? "")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(
    eduParam === "error"
      ? errorFromReason(searchParams.get("reason"))
      : null
  )
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSent(false)

    startTransition(async () => {
      const res = await fetch("/api/edu-verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eduEmail: input }),
      })

      if (res.ok) {
        setEduEmail(input)
        setSent(true)
        setVerified(false)
      } else {
        const data = await res.json().catch(() => ({}))
        const msg =
          data?.error?.fieldErrors?.eduEmail?.[0] ??
          data?.error ??
          "Something went wrong. Try again."
        setError(typeof msg === "string" ? msg : "Something went wrong.")
      }
    })
  }

  const isVerified = verified && !sent

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          College Verification
        </h2>
        {isVerified && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {isOverride ? "Staff Approved" : "Verified"}
          </span>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          To compete in C3 Esports you must verify a <strong>.edu email address</strong> issued
          by your college or university. Your account email can be anything — this is separate.
        </p>

        {/* Current verified state */}
        {isVerified && eduEmail && (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <MailCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-400 truncate">{eduEmail}</p>
              {isOverride && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manually approved by staff
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sent confirmation */}
        {sent && !isVerified && (
          <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
            <MailCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-300">Verification email sent!</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Check <strong>{eduEmail}</strong> and click the link to confirm. It expires in 24&nbsp;hours.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="edu-email" className="text-xs font-medium text-muted-foreground">
              {isVerified ? "Change college email" : "College email address"}
            </label>
            <div className="flex gap-2">
              <input
                id="edu-email"
                type="email"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="you@university.edu"
                required
                className={cn(
                  "flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm",
                  "placeholder:text-muted-foreground/50",
                  "focus:outline-none focus:ring-2 focus:ring-ring/40",
                  "disabled:opacity-50"
                )}
                disabled={isPending}
              />
              <button
                type="submit"
                disabled={isPending || !input}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium",
                  "bg-primary text-primary-foreground",
                  "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors"
                )}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isVerified ? (
                  "Re-send"
                ) : (
                  "Send Link"
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/60">
            We&apos;ll send a one-time verification link to this address.
            If your school uses a non-.edu domain, contact staff for a manual review.
          </p>
        </form>

        {/* Not a .edu? */}
        {!isVerified && (
          <p className="text-xs text-muted-foreground/50 border-t border-border pt-4">
            Don&apos;t have a .edu email?{" "}
            <a
              href="https://discord.gg/c3esports"
              className="text-blue-400 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact staff on Discord
            </a>{" "}
            for a manual review (community colleges, international students, etc).
          </p>
        )}
      </div>
    </div>
  )
}

function errorFromReason(reason: string | null): string {
  switch (reason) {
    case "expired":
      return "That verification link has expired. Please request a new one."
    case "invalid_token":
      return "That verification link is invalid. Please request a new one."
    case "missing_token":
      return "Invalid verification link. Please request a new one."
    default:
      return "Verification failed. Please try again."
  }
}
