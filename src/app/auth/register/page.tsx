"use client"

import { useState, useMemo } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

function getPasswordStrength(pw: string): {
  score: number
  label: string
  color: string
} {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  if (score <= 1) return { score, label: "Weak", color: "rgba(220,38,38,0.70)" }
  if (score <= 2)
    return { score, label: "Fair", color: "rgba(220,160,40,0.70)" }
  if (score <= 3)
    return { score, label: "Good", color: "rgba(80,130,200,0.70)" }
  return { score, label: "Strong", color: "rgba(52,211,153,0.70)" }
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [tosAccepted, setTosAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = useMemo(() => getPasswordStrength(password), [password])

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
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Registration failed. Please try again.")
      setLoading(false)
      return
    }
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      router.push("/auth/signin")
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 1800)
    }
  }

  return (
    <div className="flex min-h-[100dvh]">
      {/* ── Left panel: branding (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-center p-12"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 70% 40%, rgba(80,130,200,0.08) 0%, transparent 60%),
            oklch(0.08 0.018 260)
          `,
        }}
      >
        <div
          className="grid-bg absolute inset-0 pointer-events-none opacity-30"
          aria-hidden
        />
        <div
          className="absolute top-0 right-0 bottom-0 w-px"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(80,130,200,0.2) 30%, rgba(180,60,60,0.2) 70%, transparent)",
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
            <span className="text-white">Join the</span>{" "}
            <span style={{ color: "rgba(255,255,255,0.25)" }}>
              competition.
            </span>
          </h1>
          <p
            className="font-sans text-sm leading-relaxed mb-10 max-w-sm"
            style={{ color: "rgba(255,255,255,0.42)" }}
          >
            Create an account to register your team, join a season, and start
            competing in organized collegiate esports across the Carolinas.
          </p>

          {/* Step-by-step what happens next */}
          <div className="flex flex-col gap-4 mb-10">
            {[
              {
                step: "01",
                text: "Create your account",
                accent: "180,60,60",
              },
              {
                step: "02",
                text: "Link Discord for team comms",
                accent: "80,130,200",
              },
              {
                step: "03",
                text: "Register your team and join a season",
                accent: "220,160,40",
              },
            ].map(({ step, text, accent }) => (
              <div key={step} className="flex items-center gap-4">
                <span
                  className="font-bold text-[11px] shrink-0"
                  style={{
                    fontFamily: "var(--font-data)",
                    color: `rgba(${accent},0.60)`,
                  }}
                >
                  {step}
                </span>
                <div
                  className="h-px w-4 shrink-0"
                  style={{ background: `rgba(${accent},0.20)` }}
                />
                <span
                  className="font-sans text-sm"
                  style={{ color: "rgba(255,255,255,0.45)" }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div
            className="w-12 h-px mb-8"
            style={{ background: "rgba(80,130,200,0.30)" }}
          />

          {/* Post-registration info */}
          <div>
            <p
              className="font-sans text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              After registration, link:
            </p>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "Discord account",
                  note: "Required for team comms",
                },
                {
                  label: "Epic Games username",
                  note: "Required for Rocket League",
                },
              ].map(({ label, note }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "rgba(80,130,200,0.40)" }}
                  />
                  <span
                    className="font-sans text-xs"
                    style={{ color: "rgba(255,255,255,0.40)" }}
                  >
                    {label}
                  </span>
                  <span
                    className="font-sans text-[10px]"
                    style={{ color: "rgba(255,255,255,0.18)" }}
                  >
                    {note}
                  </span>
                </div>
              ))}
            </div>
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
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-white tracking-tight mb-1">
                Create your account
              </h2>
              <p
                className="font-sans text-sm"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                Join C3 Esports and start competing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Display Name */}
              <div className="flex flex-col gap-2">
                <label
                  className="font-sans text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Display Name
                </label>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={64}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm font-sans outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.88)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(80,130,200,0.5)"
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

              {/* Email */}
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
                    e.currentTarget.style.borderColor = "rgba(80,130,200,0.5)"
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

              {/* Password */}
              <div className="flex flex-col gap-2">
                <label
                  className="font-sans text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm font-sans outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.88)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(80,130,200,0.5)"
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(80,130,200,0.10)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.10)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                />
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background:
                              i < strength.score
                                ? strength.color
                                : "rgba(255,255,255,0.06)",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: strength.color }}
                    >
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-2">
                <label
                  className="font-sans text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm font-sans outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${
                      confirm.length > 0 && confirm !== password
                        ? "rgba(220,38,38,0.40)"
                        : "rgba(255,255,255,0.10)"
                    }`,
                    color: "rgba(255,255,255,0.88)",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(80,130,200,0.5)"
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(80,130,200,0.10)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      confirm.length > 0 && confirm !== password
                        ? "rgba(220,38,38,0.40)"
                        : "rgba(255,255,255,0.10)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                />
                {confirm.length > 0 && confirm !== password && (
                  <p
                    className="text-[10px]"
                    style={{ color: "rgba(220,38,38,0.70)" }}
                  >
                    Passwords do not match
                  </p>
                )}
              </div>

              {/* ToS */}
              <label className="flex items-start gap-2.5 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  required
                  checked={tosAccepted}
                  onChange={(e) => setTosAccepted(e.target.checked)}
                  className="mt-0.5 shrink-0 accent-blue-500"
                />
                <span
                  className="text-xs leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  I agree to the{" "}
                  <Link
                    href="/legal/terms"
                    target="_blank"
                    className="transition-colors duration-150 hover:text-white"
                    style={{ color: "rgba(80,130,200,0.75)" }}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/legal/privacy"
                    target="_blank"
                    className="transition-colors duration-150 hover:text-white"
                    style={{ color: "rgba(80,130,200,0.75)" }}
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {error && (
                <p
                  className="text-xs rounded-lg px-3 py-2.5"
                  style={{
                    background: "rgba(220,38,38,0.08)",
                    border: "1px solid rgba(220,38,38,0.18)",
                    color: "rgba(252,165,165,0.90)",
                  }}
                >
                  {error}
                </p>
              )}

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
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p
              className="text-center text-sm"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              Already have an account?{" "}
              <Link
                href="/auth/signin"
                className="font-medium transition-colors duration-150 hover:text-white"
                style={{ color: "rgba(80,130,200,0.80)" }}
              >
                Sign in
              </Link>
            </p>
          </div>

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
                    Account created
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
