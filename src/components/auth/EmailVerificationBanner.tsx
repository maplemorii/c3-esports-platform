"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"

interface Props {
  emailVerified: boolean
}

export function EmailVerificationBanner({ emailVerified }: Props) {
  const searchParams = useSearchParams()
  const justVerified = searchParams.get("verified") === "1"
  const invalidToken = searchParams.get("verified") === "invalid"

  const [resending, setResending] = useState(false)
  const [resent, setResent]       = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  async function handleResend() {
    setResending(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Failed to send.")
      } else {
        setResent(true)
      }
    } catch {
      setError("Network error.")
    } finally {
      setResending(false)
    }
  }

  if (justVerified) {
    return (
      <div className="px-6 pt-4">
        <div
          className="flex items-center gap-2 w-fit rounded-lg px-3 py-1.5 text-xs"
          style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)", color: "rgba(134,239,172,0.8)" }}
        >
          <span className="size-1.5 rounded-full bg-green-400/70 shrink-0" />
          Email verified — you now have full access.
        </div>
      </div>
    )
  }

  if (invalidToken) {
    return (
      <div className="px-6 pt-4">
        <div
          className="flex items-center gap-2 w-fit rounded-lg px-3 py-1.5 text-xs"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.15)", color: "rgba(252,165,165,0.8)" }}
        >
          <span className="size-1.5 rounded-full bg-red-400/70 shrink-0" />
          Verification link expired.{" "}
          <button onClick={handleResend} disabled={resending} className="underline underline-offset-2 disabled:opacity-50">
            {resending ? "Sending…" : "Resend"}
          </button>
        </div>
      </div>
    )
  }

  if (emailVerified || dismissed) return null

  return (
    <div className="px-6 pt-4">
      <div
        className="flex items-center gap-2.5 w-fit rounded-lg px-3 py-1.5 text-xs"
        style={{
          background: "rgba(234,179,8,0.06)",
          border: "1px solid rgba(234,179,8,0.15)",
          color: "rgba(253,224,71,0.6)",
        }}
      >
        <span className="size-1.5 rounded-full shrink-0" style={{ background: "rgba(253,224,71,0.5)" }} />
        {error
          ? error
          : resent
          ? "Check your inbox for a verification link."
          : <>Verify your email to edit your profile or join a team.</>}

        {!resent && !error && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="shrink-0 underline underline-offset-2 disabled:opacity-40 transition-opacity ml-0.5"
          >
            {resending ? "Sending…" : "Resend"}
          </button>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="ml-1 opacity-30 hover:opacity-60 transition-opacity shrink-0 leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
