"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="size-4 fill-current shrink-0">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.127 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
)

type SignInStep = "credentials" | "totp"

export default function SignInPage() {
  const router  = useRouter()
  const [step, setStep]         = useState<SignInStep>("credentials")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [totp, setTotp]         = useState("")
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)

    if (!result?.error) {
      router.push("/")
      router.refresh()
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

    const result = await signIn("credentials", { email, password, totp, redirect: false })
    setLoading(false)

    if (!result?.error) {
      router.push("/")
      router.refresh()
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
          <AnimatePresence mode="wait">
            {step === "credentials" ? (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5"
              >
                <div className="text-center">
                  <h1 className="font-sans text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    Welcome back
                  </h1>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Sign in to manage your team and view matches.
                  </p>
                </div>

                {/* Discord button */}
                <button
                  onClick={() => signIn("discord", { callbackUrl: "/" })}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl px-4 py-2.5 font-sans text-sm font-semibold transition-all duration-150"
                  style={{
                    background: "rgba(88,101,242,0.18)",
                    border: "1px solid rgba(88,101,242,0.35)",
                    color: "rgba(180,190,255,0.9)",
                  }}
                  onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = "rgba(88,101,242,0.28)"; el.style.borderColor = "rgba(88,101,242,0.55)" }}
                  onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = "rgba(88,101,242,0.18)"; el.style.borderColor = "rgba(88,101,242,0.35)" }}
                >
                  <DiscordIcon />
                  Continue with Discord
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>or</span>
                  <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>

                {/* Credentials form */}
                <form onSubmit={handleCredentials} className="flex flex-col gap-3.5">
                  <Field label="Email">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm font-sans outline-none transition-all duration-150"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)" }}
                      onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl px-3.5 py-2.5 text-sm font-sans outline-none transition-all duration-150"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)" }}
                      onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
                    />
                    <div className="flex justify-end mt-0.5">
                      <Link
                        href="/auth/forgot-password"
                        className="text-[11px] transition-colors duration-150"
                        style={{ color: "rgba(96,165,250,0.6)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(147,197,253,0.9)" }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(96,165,250,0.6)" }}
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </Field>

                  {error && <ErrorBox>{error}</ErrorBox>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl px-4 py-2.5 font-sans text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))", boxShadow: "0 0 20px rgba(196,28,53,0.2)" }}
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </button>
                </form>

                <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
                  No account?{" "}
                  <Link
                    href="/auth/register"
                    className="font-medium transition-colors duration-150"
                    style={{ color: "rgba(96,165,250,0.8)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(147,197,253,1)" }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(96,165,250,0.8)" }}
                  >
                    Register
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="totp"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-5"
              >
                <div className="text-center">
                  <h1 className="font-sans text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    Two-factor authentication
                  </h1>
                  <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Enter the 6-digit code from your authenticator app.
                  </p>
                </div>

                <form onSubmit={handleTotp} className="flex flex-col gap-3.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    placeholder="000 000"
                    maxLength={7}
                    value={totp}
                    onChange={(e) => setTotp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-xl px-3.5 py-3 text-xl font-mono text-center outline-none transition-all duration-150 tracking-widest"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(59,130,246,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)" }}
                    onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
                  />

                  {error && <ErrorBox>{error}</ErrorBox>}

                  <button
                    type="submit"
                    disabled={loading || totp.length < 6}
                    className="w-full rounded-xl px-4 py-2.5 font-sans text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))", boxShadow: "0 0 20px rgba(196,28,53,0.2)" }}
                  >
                    {loading ? "Verifying…" : "Verify"}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep("credentials"); setTotp(""); setError(null) }}
                    className="text-xs text-center transition-colors duration-150"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    ← Back
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs leading-relaxed max-w-[30ch]" style={{ color: "rgba(255,255,255,0.18)" }}>
          To compete you&apos;ll need to link Discord, email, and an Epic Games username.
        </p>
      </motion.div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.28)" }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs rounded-lg px-3 py-2"
      style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "rgba(252,165,165,0.9)" }}
    >
      {children}
    </p>
  )
}
