"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Lock, ArrowRight, Loader2 } from "lucide-react"

export default function BetaGatePage() {
  const router   = useRouter()
  const [pw,       setPw]       = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [showPw,   setShowPw]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/beta-access", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password: pw }),
      })
      if (!res.ok) {
        setError("Incorrect password.")
        return
      }
      // Reload to re-run middleware with the new cookie
      router.refresh()
      router.push("/")
    } catch {
      setError("Something went wrong. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center px-4 overflow-hidden"
      style={{ background: "oklch(0.08 0.018 265)" }}
    >
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden
      />

      {/* Red glow top-left */}
      <div
        className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, rgba(196,28,53,0.8), transparent 70%)", filter: "blur(80px)" }}
        aria-hidden
      />
      {/* Blue glow bottom-right */}
      <div
        className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.7), transparent 70%)", filter: "blur(80px)" }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-sm">

        {/* Logo */}
        <Image
          src="/logo.png"
          alt="C3 Esports"
          width={240}
          height={56}
          style={{ height: "48px", width: "auto", opacity: 0.9 }}
          priority
        />

        {/* Headline */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.25)", color: "rgba(220,60,80,0.9)" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            Private Beta
          </div>
          <h1
            className="font-display text-4xl font-black uppercase tracking-tight sm:text-5xl"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Coming Soon
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
            C3 Esports is not yet open to the public.<br />
            Staff and beta testers can enter below.
          </p>
        </div>

        {/* Card */}
        <div
          className="w-full rounded-2xl p-6 flex flex-col gap-4"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.2)" }}
            >
              <Lock className="h-3.5 w-3.5" style={{ color: "rgba(196,28,53,0.9)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
              Staff &amp; Beta Access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="Enter access password…"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                required
                autoFocus
                className="w-full rounded-xl px-4 py-2.5 pr-10 text-sm font-sans outline-none transition-all duration-150"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.85)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "rgba(196,28,53,0.45)"
                  e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(196,28,53,0.1)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"
                  e.currentTarget.style.boxShadow   = "none"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wide transition-colors"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                {showPw ? "Hide" : "Show"}
              </button>
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
              disabled={loading || pw.length === 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, rgba(196,28,53,0.85), rgba(59,130,246,0.85))",
                boxShadow:  "0 0 24px rgba(196,28,53,0.18)",
              }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>Enter Site <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px]" style={{ color: "rgba(255,255,255,0.15)" }}>
          Need access? Reach out to a staff member.
        </p>
      </div>
    </div>
  )
}
