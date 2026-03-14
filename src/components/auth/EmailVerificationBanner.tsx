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
  const [error, setError]         = useState<string | null>(null)

  // Show success toast if just verified
  if (justVerified) {
    return (
      <div
        className="w-full px-4 py-2.5 text-sm text-center font-medium"
        style={{
          background: "rgba(22,163,74,0.12)",
          borderBottom: "1px solid rgba(22,163,74,0.25)",
          color: "rgba(134,239,172,0.9)",
        }}
      >
        Email verified — you now have full access.
      </div>
    )
  }

  if (invalidToken) {
    return (
      <div
        className="w-full px-4 py-2.5 text-sm text-center font-medium"
        style={{
          background: "rgba(220,38,38,0.08)",
          borderBottom: "1px solid rgba(220,38,38,0.2)",
          color: "rgba(252,165,165,0.9)",
        }}
      >
        That verification link is invalid or expired. Request a new one below.
      </div>
    )
  }

  if (emailVerified) return null

  async function handleResend() {
    setResending(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Failed to send. Try again later.")
      } else {
        setResent(true)
      }
    } catch {
      setError("Network error. Try again.")
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm"
      style={{
        background: "rgba(234,179,8,0.08)",
        borderBottom: "1px solid rgba(234,179,8,0.2)",
        color: "rgba(253,224,71,0.85)",
      }}
    >
      <span>
        {error
          ? error
          : resent
          ? "Verification email sent — check your inbox."
          : "Please verify your email address to edit your profile or join a team."}
      </span>

      {!resent && (
        <button
          onClick={handleResend}
          disabled={resending}
          className="shrink-0 text-xs font-semibold underline underline-offset-2 disabled:opacity-50 transition-opacity"
        >
          {resending ? "Sending…" : "Resend email"}
        </button>
      )}
    </div>
  )
}
