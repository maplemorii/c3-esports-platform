"use client"

/**
 * PlayerProfileForm
 *
 * Reusable form for creating or editing a player profile.
 * Used by: /profile/setup (create), /profile/edit (update)
 *
 * Usage:
 *   <PlayerProfileForm mode="create" onSuccess={(player) => router.push("/profile")} />
 *   <PlayerProfileForm mode="edit" initialValues={player} onSuccess={() => router.refresh()} />
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import {
  User,
  MessageSquare,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerProfileFormValues {
  displayName:     string
  discordUsername: string
  bio:             string
}

interface PlayerProfileFormProps {
  mode:          "create" | "edit"
  /** Required when mode="edit" — the player's id for the PATCH endpoint */
  playerId?:     string
  initialValues?: Partial<PlayerProfileFormValues>
  /** Called with the saved player data on success */
  onSuccess?:    (player: PlayerProfileFormValues & { id: string }) => void
  /** Optional cancel handler (edit mode) */
  onCancel?:     () => void
}

// ---------------------------------------------------------------------------
// Validation helpers (mirrors Zod schema client-side)
// ---------------------------------------------------------------------------

function validate(vals: PlayerProfileFormValues) {
  const errors: Partial<Record<keyof PlayerProfileFormValues, string>> = {}

  if (!vals.displayName.trim()) {
    errors.displayName = "Display name is required"
  } else if (vals.displayName.trim().length < 2) {
    errors.displayName = "Display name must be at least 2 characters"
  } else if (vals.displayName.trim().length > 32) {
    errors.displayName = "Display name must be 32 characters or less"
  }

  if (vals.discordUsername) {
    const valid =
      /^@?[a-z0-9_.]{2,32}$/i.test(vals.discordUsername) ||
      /^[^#]{2,32}#\d{4}$/i.test(vals.discordUsername)
    if (!valid) {
      errors.discordUsername = "Must be a valid Discord username (e.g. username or OldName#1234)"
    }
  }

  if (vals.bio && vals.bio.length > 500) {
    errors.bio = "Bio must be 500 characters or less"
  }

  return errors
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PlayerProfileForm({
  mode,
  playerId,
  initialValues,
  onSuccess,
  onCancel,
}: PlayerProfileFormProps) {
  const router = useRouter()

  const [values, setValues] = useState<PlayerProfileFormValues>({
    displayName:     initialValues?.displayName     ?? "",
    discordUsername: initialValues?.discordUsername ?? "",
    bio:             initialValues?.bio             ?? "",
  })
  const [errors,   setErrors]   = useState<Partial<Record<keyof PlayerProfileFormValues, string>>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)

  function field(key: keyof PlayerProfileFormValues) {
    return {
      value:    values[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setValues((prev) => ({ ...prev, [key]: e.target.value }))
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
        setApiError(null)
      },
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    setApiError(null)

    try {
      const body = {
        displayName:     values.displayName.trim()     || undefined,
        discordUsername: values.discordUsername.trim() || undefined,
        bio:             values.bio.trim()             || undefined,
      }

      const res = await fetch(
        mode === "create" ? "/api/players" : `/api/players/${playerId}`,
        {
          method:  mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        }
      )

      const json = await res.json()

      if (!res.ok) {
        setApiError(json?.error ?? "Something went wrong. Please try again.")
        return
      }

      setSaved(true)
      onSuccess?.(json)

      // Default navigation for create mode
      if (mode === "create" && !onSuccess) {
        setTimeout(() => router.push("/profile"), 800)
      }
    } catch {
      setApiError("Network error. Please check your connection and try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* API error banner */}
      {apiError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {apiError}
        </div>
      )}

      {/* ── Display Name ─────────────────────────────────────────────────── */}
      <FormField
        label="Display Name"
        hint="This is your public in-platform name."
        required
        error={errors.displayName}
        icon={<User className="h-4 w-4" />}
      >
        <input
          type="text"
          placeholder="e.g. NightOwl"
          maxLength={32}
          autoComplete="off"
          {...field("displayName")}
          className={inputCls(!!errors.displayName)}
        />
        <CharCount current={values.displayName.length} max={32} />
      </FormField>

      {/* ── Discord Username ─────────────────────────────────────────────── */}
      <FormField
        label="Discord Username"
        hint="Your Discord username (e.g. username or OldName#1234)."
        error={errors.discordUsername}
        icon={<MessageSquare className="h-4 w-4" />}
      >
        <input
          type="text"
          placeholder="e.g. nightowl or NightOwl#1234"
          maxLength={37}
          autoComplete="off"
          {...field("discordUsername")}
          className={inputCls(!!errors.discordUsername)}
        />
      </FormField>

      {/* ── Bio ──────────────────────────────────────────────────────────── */}
      <FormField
        label="Bio"
        hint="A short blurb about yourself. Optional."
        error={errors.bio}
        icon={<FileText className="h-4 w-4" />}
      >
        <textarea
          placeholder="Tell teammates a bit about yourself…"
          maxLength={500}
          rows={3}
          {...field("bio")}
          className={cn(inputCls(!!errors.bio), "resize-none")}
        />
        <CharCount current={values.bio.length} max={500} />
      </FormField>

      {/* ── Actions ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={saving || saved}
          className="inline-flex items-center justify-center min-w-35 gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed"
          style={saved ? {
            background: "rgba(52,211,153,0.85)",
            boxShadow: "0 0 12px rgba(52,211,153,0.2)",
          } : {
            background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))",
            boxShadow: "0 0 16px rgba(196,28,53,0.2)",
          }}
        >
          {saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {mode === "create" ? "Profile created!" : "Saved!"}
            </>
          ) : saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating…" : "Saving…"}
            </>
          ) : (
            mode === "create" ? "Create Profile" : "Save Changes"
          )}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={buttonVariants({ variant: "ghost", size: "default" })}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function FormField({
  label,
  hint,
  required,
  error,
  icon,
  children,
}: {
  label:    string
  hint?:    string
  required?: boolean
  error?:   string
  icon?:    React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {icon && (
          <span className="text-muted-foreground">{icon}</span>
        )}
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function CharCount({ current, max }: { current: number; max: number }) {
  const near = current >= max * 0.85
  return (
    <p className={cn("text-xs text-right", near ? "text-amber-400" : "text-muted-foreground/50")}>
      {current}/{max}
    </p>
  )
}

function inputCls(hasError: boolean) {
  return cn(
    "w-full rounded-md border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50",
    "focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60",
    "transition-colors",
    hasError
      ? "border-destructive/60 focus:ring-destructive/30 focus:border-destructive/60"
      : "border-border hover:border-border/80"
  )
}
