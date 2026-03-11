"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { CheckCircle2, Circle } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [tosAccepted, setTosAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) { setError("Passwords do not match."); return }
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
    const result = await signIn("credentials", { email, password, redirect: false })
    setLoading(false)
    if (result?.error) { router.push("/auth/signin") } else { router.push("/"); router.refresh() }
  }

  return (
    <div
      className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 overflow-hidden"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      {/* Ambient orb */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(220,38,38,0.15) 40%, transparent 70%)", filter: "blur(80px)" }}
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-7 w-full max-w-sm"
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
          <div className="text-center">
            <h1 className="font-sans text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              Create your account
            </h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              Join C3 Esports and start competing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <Field label="Display Name">
              <input id="name" type="text" autoComplete="name" required minLength={2} maxLength={64}
                value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm font-sans outline-none transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
              />
            </Field>
            <Field label="Email">
              <input id="email" type="email" autoComplete="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm font-sans outline-none transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
              />
            </Field>
            <Field label="Password">
              <input id="password" type="password" autoComplete="new-password" required minLength={8}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm font-sans outline-none transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
              />
            </Field>
            <Field label="Confirm Password">
              <input id="confirm" type="password" autoComplete="new-password" required
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm font-sans outline-none transition-all duration-150"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)" }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none" }}
              />
            </Field>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={tosAccepted}
                onChange={(e) => setTosAccepted(e.target.checked)}
                className="mt-0.5 shrink-0 accent-violet-500"
              />
              <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                I agree to the{" "}
                <Link href="/legal/terms" target="_blank" className="transition-colors duration-150" style={{ color: "rgba(167,139,250,0.8)" }}>
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" target="_blank" className="transition-colors duration-150" style={{ color: "rgba(167,139,250,0.8)" }}>
                  Privacy Policy
                </Link>
              </span>
            </label>

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
              className="w-full rounded-xl px-4 py-2.5 font-sans text-sm font-semibold transition-all duration-150 disabled:opacity-50"
              style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.3)", color: "rgba(196,181,253,0.9)" }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "rgba(124,58,237,0.28)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)" } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(124,58,237,0.18)"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)" }}
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="font-medium transition-colors duration-150"
              style={{ color: "rgba(167,139,250,0.8)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(196,181,253,1)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(167,139,250,0.8)" }}
            >
              Sign In
            </Link>
          </p>
        </div>

        {/* Requirements checklist */}
        <div
          className="w-full rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.22)" }}>
            To compete, you&apos;ll also need to link:
          </p>
          <ul className="flex flex-col gap-2">
            {[
              { done: true,  label: "Email & password",   note: "set here" },
              { done: false, label: "Discord account",    note: "link in profile" },
              { done: false, label: "Epic Games username", note: "link in profile" },
            ].map(({ done, label, note }) => (
              <li key={label} className="flex items-center gap-2.5">
                {done
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(52,211,153,0.7)" }} />
                  : <Circle className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.18)" }} />
                }
                <span className="text-xs flex-1" style={{ color: done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.28)" }}>
                  {label}
                </span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.16)" }}>{note}</span>
              </li>
            ))}
          </ul>
        </div>
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
