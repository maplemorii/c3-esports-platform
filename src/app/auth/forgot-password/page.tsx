"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("")
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      // Always show success to avoid user enumeration
      setSubmitted(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Ambient orb */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-150 h-150 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(220,38,38,0.15) 40%, transparent 70%)", filter: "blur(80px)" }}
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <Link href="/" aria-label="C3 Esports — home">
          <Image src="/logo.png" alt="C3 Esports" width={200} height={48} style={{ height: "42px", width: "auto" }} />
        </Link>

        {/* Card */}
        <div
          className="w-full flex flex-col gap-5 rounded-2xl p-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {submitted ? (
            /* Success state */
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}
              >
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="font-sans text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Check your email
                </h1>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                  If an account exists for <span className="font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{email}</span>, you&apos;ll receive a reset link within a few minutes.
                </p>
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
                The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/auth/signin"
                className="w-full rounded-xl px-4 py-2.5 font-sans text-sm font-semibold text-white text-center transition-all duration-150"
                style={{ background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))", boxShadow: "0 0 20px rgba(196,28,53,0.2)" }}
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* Form */
            <>
              <div className="text-center">
                <div
                  className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)" }}
                >
                  <Mail className="h-5 w-5" style={{ color: "rgba(96,165,250,0.9)" }} />
                </div>
                <h1 className="font-sans text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Reset your password
                </h1>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className="text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: "rgba(255,255,255,0.28)" }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>

              <Link
                href="/auth/signin"
                className="flex items-center justify-center gap-1.5 text-xs transition-colors duration-150"
                style={{ color: "rgba(255,255,255,0.28)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.28)" }}
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
