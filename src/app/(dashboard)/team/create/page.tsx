"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormState {
  name:            string
  primaryColor:    string
  secondaryColor:  string
  website:         string
  twitterHandle:   string
  discordInvite:   string
}

const INITIAL: FormState = {
  name:           "",
  primaryColor:   "",
  secondaryColor: "",
  website:        "",
  twitterHandle:  "",
  discordInvite:  "",
}

// ---------------------------------------------------------------------------
// Shared input class
// ---------------------------------------------------------------------------

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none " +
  "placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring " +
  "disabled:opacity-50"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamCreatePage() {
  const router = useRouter()
  const [form, setForm]       = useState<FormState>(INITIAL)
  const [error, setError]     = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Clear per-field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setLoading(true)

    // Build payload — omit empty optional strings
    const payload: Record<string, string> = { name: form.name }
    if (form.primaryColor)  payload.primaryColor  = form.primaryColor
    if (form.secondaryColor) payload.secondaryColor = form.secondaryColor
    if (form.website)       payload.website       = form.website
    if (form.twitterHandle) payload.twitterHandle = form.twitterHandle
    if (form.discordInvite) payload.discordInvite = form.discordInvite

    const res = await fetch("/api/teams", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))
    setLoading(false)

    if (!res.ok) {
      if (data?.details?.fieldErrors) {
        setFieldErrors(data.details.fieldErrors)
      } else {
        setError(data?.error ?? "Something went wrong. Please try again.")
      }
      return
    }

    router.push(`/team/${data.id}`)
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-1">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit -ml-2 gap-1.5 text-muted-foreground mb-2"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Create a Team
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up your team profile. You can update logo and colors later.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">

          {/* ── Identity ─────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              Identity
            </h2>
            <div className="flex flex-col gap-4">

              <Field
                label="Team Name"
                required
                hint="2–50 characters. Must be unique across the platform."
                error={fieldErrors.name?.[0]}
              >
                <input
                  type="text"
                  placeholder="e.g. Carolina Chaos"
                  required
                  minLength={2}
                  maxLength={50}
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className={inputCls}
                />
              </Field>

            </div>
          </section>

          {/* ── Branding ─────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              Branding
            </h2>
            <div className="flex flex-col gap-4">

              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Primary Color"
                  hint="Hex format e.g. #C0273A"
                  error={fieldErrors.primaryColor?.[0]}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor || "#C0273A"}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded-md border border-input bg-background p-1"
                    />
                    <input
                      type="text"
                      placeholder="#C0273A"
                      maxLength={7}
                      value={form.primaryColor}
                      onChange={(e) => update("primaryColor", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </Field>

                <Field
                  label="Secondary Color"
                  hint="Hex format e.g. #1B2A4A"
                  error={fieldErrors.secondaryColor?.[0]}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.secondaryColor || "#1B2A4A"}
                      onChange={(e) => update("secondaryColor", e.target.value)}
                      className="h-9 w-10 cursor-pointer rounded-md border border-input bg-background p-1"
                    />
                    <input
                      type="text"
                      placeholder="#1B2A4A"
                      maxLength={7}
                      value={form.secondaryColor}
                      onChange={(e) => update("secondaryColor", e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </Field>
              </div>

            </div>
          </section>

          {/* ── Links ────────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              Links <span className="normal-case font-normal tracking-normal text-muted-foreground/60">(all optional)</span>
            </h2>
            <div className="flex flex-col gap-4">

              <Field
                label="Website"
                error={fieldErrors.website?.[0]}
              >
                <input
                  type="url"
                  placeholder="https://yourteam.gg"
                  maxLength={255}
                  value={form.website}
                  onChange={(e) => update("website", e.target.value)}
                  className={inputCls}
                />
              </Field>

              <Field
                label="Twitter / X Handle"
                hint="With or without the @ — e.g. C3EsportsRL"
                error={fieldErrors.twitterHandle?.[0]}
              >
                <div className="flex items-center">
                  <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="C3EsportsRL"
                    maxLength={15}
                    value={form.twitterHandle.replace(/^@/, "")}
                    onChange={(e) => update("twitterHandle", e.target.value)}
                    className={cn(inputCls, "rounded-l-none")}
                  />
                </div>
              </Field>

              <Field
                label="Discord Server Invite"
                error={fieldErrors.discordInvite?.[0]}
              >
                <input
                  type="url"
                  placeholder="https://discord.gg/yourserver"
                  maxLength={255}
                  value={form.discordInvite}
                  onChange={(e) => update("discordInvite", e.target.value)}
                  className={inputCls}
                />
              </Field>

            </div>
          </section>

          {/* ── Error + Submit ───────────────────────────────────── */}
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pb-2">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "outline" }), "px-6")}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={cn(buttonVariants({ size: "lg" }), "px-8 gap-2")}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Creating…" : "Create Team"}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label:    string
  required?: boolean
  hint?:    string
  error?:   string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-brand">*</span>}
      </label>
      {children}
      {error  && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground/60">{hint}</p>}
    </div>
  )
}
