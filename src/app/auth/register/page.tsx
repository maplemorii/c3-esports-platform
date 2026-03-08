"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError("Passwords do not match.")
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

    // Auto sign-in after successful registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      // Registration succeeded but auto sign-in failed — send to sign-in page
      router.push("/auth/signin")
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center gap-8 px-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          <span className="text-brand">C3</span> Esports
        </h1>
        <p className="text-sm text-muted-foreground">Create your account to get started.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Display Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={64}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Confirm Password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(buttonVariants({ size: "lg" }), "w-full mt-1")}
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-brand hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>

      {/* What you'll need to complete */}
      <div className="w-full max-w-sm rounded-lg border border-border bg-card/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          To register for a season you will also need to link:
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-brand">✓</span> Email &amp; password <span className="ml-auto text-xs text-muted-foreground">(set here)</span>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <span>○</span> Discord account <span className="ml-auto text-xs">(link in profile)</span>
          </li>
          <li className="flex items-center gap-2 text-muted-foreground">
            <span>○</span> Epic Games username <span className="ml-auto text-xs">(link in profile)</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
