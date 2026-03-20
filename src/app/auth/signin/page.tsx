"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4 fill-current shrink-0">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
)

type SignInStep = "credentials" | "totp"

export default function SignInPage() {
  const router = useRouter()
  const [step, setStep] = useState<SignInStep>("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [totp, setTotp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    setLoading(false)

    if (!result?.error) {
      setSuccess(true)
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 1800)
      return
    }

    if (result.error === "2FA_REQUIRED") {
      setStep("totp")
    } else {
      setError("Invalid email or password.")
    }
  }

  async function handleTotp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      totp,
      redirect: false,
    })
    setLoading(false)

    if (!result?.error) {
      setSuccess(true)
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 1800)
      return
    }

    if (result.error === "2FA_INVALID") {
      setError("Incorrect code. Try again.")
    } else {
      setError("Sign-in failed. Please start over.")
      setStep("credentials")
      setTotp("")
    }
  }

  return (
    <div className="flex min-h-[100dvh]">
      {/* ── Left panel: branding (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-center p-12"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 30% 60%, rgba(180,60,60,0.10) 0%, transparent 60%),
            oklch(0.08 0.018 260)
          `,
        }}
      >
        {/* Grid overlay */}
        <div
          className="grid-bg absolute inset-0 pointer-events-none opacity-30"
          aria-hidden
        />

        {/* Right border accent */}
        <div
          className="absolute top-0 right-0 bottom-0 w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(180,60,60,0.2) 30%, rgba(80,130,200,0.2) 70%, transparent)",
          }}
          aria-hidden
        />

        {/* Large decorative watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
          aria-hidden
        >
          <span
            className="font-display font-bold"
            style={{
              fontSize: "clamp(18rem, 28vw, 28rem)",
              color: "rgba(255,255,255,0.015)",
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
            }}
          >
            C3
          </span>
        </div>

        {/* Logo — pinned top-left */}
        <div className="absolute top-12 left-12 z-[1]">
          <Link href="/" aria-label="C3 Esports home">
            <Image
              src="/logo.png"
              alt="C3 Esports"
              width={200}
              height={48}
              style={{ height: "38px", width: "auto" }}
            />
          </Link>
        </div>

        {/* Centered content cluster */}
        <div className="relative max-w-lg">
          {/* Brand message */}
          <h1
            className="font-display font-bold tracking-tight leading-[0.92] mb-5"
            style={{ fontSize: "clamp(2.4rem, 4vw, 3.8rem)" }}
          >
            <span className="text-white">Compete.</span>{" "}
            <span style={{ color: "rgba(255,255,255,0.25)" }}>
              Track. Win.
            </span>
          </h1>
          <p
            className="font-sans text-sm leading-relaxed mb-10 max-w-sm"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            Join the premier collegiate esports league in the Carolinas. Manage
            your team, track standings, and compete in organized weekly matches.
          </p>

          {/* Game title pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {["Rocket League", "Valorant", "Overwatch 2"].map((game) => (
              <span
                key={game}
                className="font-sans text-[11px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                {game}
              </span>
            ))}
          </div>

          {/* Divider */}
          <div
            className="w-12 h-px mb-8"
            style={{ background: "rgba(180,60,60,0.30)" }}
          />

          {/* Quick stats */}
          <div className="flex gap-10">
            {[
              { value: "56+", label: "Teams" },
              { value: "3", label: "Titles" },
              { value: "200+", label: "Matches" },
            ].map(({ value, label }) => (
              <div key={label}>
                <span
                  className="block text-lg font-bold text-white"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  {value}
                </span>
                <span
                  className="font-sans text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-start pt-24 lg:justify-center lg:pt-0 px-4 md:px-6 py-16 relative"
        style={{ background: "oklch(0.09 0.015 260)" }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" aria-label="C3 Esports home">
            <Image
              src="/logo.png"
              alt="C3 Esports"
              width={200}
              height={48}
              style={{ height: "38px", width: "auto" }}
            />
          </Link>
        </div>

        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="font-display text-2xl font-bold text-white tracking-tight mb-1">
                    Welcome back
                  </h2>
                  <p
                    className="font-sans text-sm"
                    style={{ color: "rgba(255,255,255,0.40)" }}
                  >
                    Sign in to manage your team and matches.
                  </p>
                </div>

                {/* Discord OAuth */}
                <button
                  onClick={() => signIn("discord", { callbackUrl: "/" })}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-3 font-sans text-sm font-semibold transition-all duration-150 active:scale-[0.98]"
                  style={{
                    background: "rgba(88,101,242,0.15)",
                    border: "1px solid rgba(88,101,242,0.30)",
                    color: "rgba(180,190,255,0.90)",
                  }}
                >
                  <DiscordIcon />
                  Continue with Discord
                </button>

                <div className="flex items-center gap-3">
                  <div
                    className="h-px flex-1"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  />
                  <span
                    className="text-[11px] uppercase tracking-wider"
                    style={{ color: "rgba(255,255,255,0.20)" }}
                  >
                    or
                  </span>
                  <div
                    className="h-px flex-1"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  />
                </div>

                <form
                  onSubmit={handleCredentials}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <label
                      className="font-sans text-[11px] font-semibold uppercase tracking-wider"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm font-sans outline-none transition-all duration-200"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "rgba(255,255,255,0.88)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(80,130,200,0.5)"
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(80,130,200,0.10)"
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.10)"
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label
                        className="font-sans text-[11px] font-semibold uppercase tracking-wider"
                        style={{ color: "rgba(255,255,255,0.35)" }}
                      >
                        Password
                      </label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-[11px] font-medium transition-colors duration-150 hover:text-blue-300"
                        style={{ color: "rgba(80,130,200,0.60)" }}
                      >
                        Forgot?
                      </Link>
                    </div>
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl px-4 py-3 text-sm font-sans outline-none transition-all duration-200"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "rgba(255,255,255,0.88)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(80,130,200,0.5)"
                        e.currentTarget.style.boxShadow =
                          "0 0 0 3px rgba(80,130,200,0.10)"
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.10)"
                        e.currentTarget.style.boxShadow = "none"
                      }}
                    />
                  </div>

                  {error && <ErrorBox>{error}</ErrorBox>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl px-4 py-3 font-sans text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
                    style={{
                      background: "oklch(0.52 0.20 17)",
                      boxShadow:
                        "0 4px 16px rgba(180,60,60,0.15), inset 0 1px 0 rgba(255,255,255,0.10)",
                    }}
                  >
                    {loading ? "Signing in..." : "Sign in"}
                  </button>
                </form>

                <p
                  className="text-center text-sm"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  No account?{" "}
                  <Link
                    href="/auth/register"
                    className="font-medium transition-colors duration-150 hover:text-white"
                    style={{ color: "rgba(80,130,200,0.80)" }}
                  >
                    Create one
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="totp"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
              >
                <div>
                  <h2 className="font-display text-2xl font-bold text-white tracking-tight mb-1">
                    Two-factor authentication
                  </h2>
                  <p
                    className="font-sans text-sm"
                    style={{ color: "rgba(255,255,255,0.40)" }}
                  >
                    Enter the 6-digit code from your authenticator app.
                  </p>
                </div>

                <form onSubmit={handleTotp} className="flex flex-col gap-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    placeholder="000 000"
                    maxLength={7}
                    value={totp}
                    onChange={(e) =>
                      setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className="w-full rounded-xl px-4 py-4 text-2xl font-mono text-center outline-none tracking-[0.3em] transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      color: "rgba(255,255,255,0.88)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(80,130,200,0.5)"
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px rgba(80,130,200,0.10)"
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor =
                        "rgba(255,255,255,0.10)"
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  />

                  {error && <ErrorBox>{error}</ErrorBox>}

                  <button
                    type="submit"
                    disabled={loading || totp.length < 6}
                    className="w-full rounded-xl px-4 py-3 font-sans text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 active:scale-[0.98]"
                    style={{
                      background: "oklch(0.52 0.20 17)",
                      boxShadow:
                        "0 4px 16px rgba(180,60,60,0.15), inset 0 1px 0 rgba(255,255,255,0.10)",
                    }}
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials")
                      setTotp("")
                      setError(null)
                    }}
                    className="text-xs text-center transition-colors duration-150 hover:text-white/50"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                  >
                    Back to sign in
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success overlay */}
          <AnimatePresence>
            {success && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: "oklch(0.09 0.015 260)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  className="text-center"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2,
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                  }}
                >
                  <motion.div
                    className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{
                      background: "rgba(52,211,153,0.12)",
                      border: "1px solid rgba(52,211,153,0.25)",
                    }}
                  >
                    <svg
                      className="h-7 w-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(52,211,153,0.8)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path
                        d="M5 13l4 4L19 7"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4, delay: 0.5 }}
                      />
                    </svg>
                  </motion.div>
                  <p className="font-display text-lg font-bold text-white">
                    Signed in
                  </p>
                  <p
                    className="font-sans text-sm mt-1"
                    style={{ color: "rgba(255,255,255,0.40)" }}
                  >
                    Redirecting to dashboard...
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs rounded-lg px-3 py-2.5"
      style={{
        background: "rgba(220,38,38,0.08)",
        border: "1px solid rgba(220,38,38,0.18)",
        color: "rgba(252,165,165,0.90)",
      }}
    >
      {children}
    </p>
  )
}
