"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { KeyRound, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react"

// ---------------------------------------------------------------------------
// Inner component — reads searchParams (must be wrapped in Suspense)
// ---------------------------------------------------------------------------

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get("token")

  const [password,  setPassword]  = useState("")
  const [confirm,   setConfirm]   = useState("")
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try requesting a new link.")
        return
      }
      setSuccess(true)
      // Redirect to sign-in after a brief moment
      setTimeout(() => router.push("/auth/signin"), 2500)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // No token in URL
  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}
        >
          <AlertTriangle className="h-6 w-6" style={{ color: "rgba(252,165,165,0.9)" }} />
        </div>
        <div>
          <h1 className="font-sans text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Invalid link
          </h1>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            This reset link is missing a token. Request a new one.
          </p>
        </div>
        <Link
          href="/auth/forgot-password"
          className="w-full rounded-xl px-4 py-2.5 font-sans text-sm font-semibold text-white text-center transition-all duration-150"
          style={{ background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))" }}
        >
          Request New Link
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}
        >
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-sans text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
            Password updated
          </h1>
          <p className="text-sm mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            All sessions have been signed out. Redirecting you to sign in…
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
          style={{ background: "rgba(196,28,53,0.08)", border: "1px solid rgba(196,28,53,0.2)" }}
        >
          <KeyRound className="h-5 w-5" style={{ color: "rgba(196,28,53,0.9)" }} />
        </div>
        <h1 className="font-sans text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
          Choose a new password
        </h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
          Must be at least 8 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* New password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="password"
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 pr-10 text-sm font-sans outline-none transition-all duration-150"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.85)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)" }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="confirm"
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            Confirm Password
          </label>
          <input
            id="confirm"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm font-sans outline-none transition-all duration-150"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.85)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)" }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
          />
        </div>

        {error && (
          <p
            className="text-xs rounded-lg px-3 py-2"
            style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "rgba(252,165,165,0.9)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl px-4 py-2.5 font-sans text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))",
            boxShadow: "0 0 20px rgba(196,28,53,0.2)",
          }}
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>

      <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
        Remember it?{" "}
        <Link
          href="/auth/signin"
          className="font-medium transition-colors duration-150"
          style={{ color: "rgba(96,165,250,0.8)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(147,197,253,1)" }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(96,165,250,0.8)" }}
        >
          Sign in
        </Link>
      </p>
    </>
  )
}

// ---------------------------------------------------------------------------
// Page — wraps form in Suspense (required for useSearchParams)
// ---------------------------------------------------------------------------

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 overflow-hidden">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, rgba(196,28,53,0.4) 0%, rgba(59,130,246,0.15) 40%, transparent 70%)", filter: "blur(80px)" }}
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link href="/" aria-label="C3 Esports — home">
          <Image src="/logo.png" alt="C3 Esports" width={200} height={48} style={{ height: "42px", width: "auto" }} />
        </Link>

        <div
          className="w-full flex flex-col gap-5 rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <Suspense fallback={<div className="h-48 animate-pulse rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }} />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  )
}
