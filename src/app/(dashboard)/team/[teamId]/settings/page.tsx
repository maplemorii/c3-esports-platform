"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Upload, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface TeamData {
  id:             string
  name:           string
  slug:           string
  logoUrl:        string | null
  primaryColor:   string | null
  secondaryColor: string | null
  website:        string | null
  twitterHandle:  string | null
  discordInvite:  string | null
  ownerId:        string
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none " +
  "placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TeamSettingsPage() {
  const params = useParams<{ teamId: string }>()
  const teamId = params.teamId
  const router = useRouter()

  const [team,    setTeam]    = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  // Form state — initialised from fetched team
  const [name,           setName]           = useState("")
  const [primaryColor,   setPrimaryColor]   = useState("")
  const [secondaryColor, setSecondaryColor] = useState("")
  const [website,        setWebsite]        = useState("")
  const [twitterHandle,  setTwitterHandle]  = useState("")
  const [discordInvite,  setDiscordInvite]  = useState("")

  // Logo upload state
  const fileRef         = useRef<HTMLInputElement>(null)
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null)
  const [logoFile,      setLogoFile]      = useState<File | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUploaded,  setLogoUploaded]  = useState(false)
  const [logoError,     setLogoError]     = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Fetch team
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function load() {
      const res  = await fetch(`/api/teams/${teamId}`)
      if (!res.ok) { router.replace(`/team/${teamId}`); return }
      const data: TeamData = await res.json()
      setTeam(data)
      setName(data.name)
      setPrimaryColor(data.primaryColor ?? "")
      setSecondaryColor(data.secondaryColor ?? "")
      setWebsite(data.website ?? "")
      setTwitterHandle((data.twitterHandle ?? "").replace(/^@/, ""))
      setDiscordInvite(data.discordInvite ?? "")
      setLoading(false)
    }
    load()
  }, [teamId, router])

  // ---------------------------------------------------------------------------
  // Save team info
  // ---------------------------------------------------------------------------

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSaved(false)
    setSaving(true)

    const payload: Record<string, string> = { name }
    if (primaryColor)  payload.primaryColor  = primaryColor
    if (secondaryColor) payload.secondaryColor = secondaryColor
    if (website)       payload.website       = website
    if (twitterHandle) payload.twitterHandle = twitterHandle
    if (discordInvite) payload.discordInvite = discordInvite

    const res  = await fetch(`/api/teams/${teamId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)

    if (!res.ok) {
      if (data?.details?.fieldErrors) setFieldErrors(data.details.fieldErrors)
      else setError(data?.error ?? "Failed to save changes")
      return
    }

    setTeam(data)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  // ---------------------------------------------------------------------------
  // Logo upload
  // ---------------------------------------------------------------------------

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setLogoUploaded(false)
    setLogoError(null)
  }

  async function handleLogoUpload() {
    if (!logoFile) return
    setLogoError(null)
    setUploadingLogo(true)

    try {
      // 1. Get presigned URL
      const presignRes = await fetch(`/api/teams/${teamId}/logo`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ filename: logoFile.name, contentType: logoFile.type }),
      })
      const presignData = await presignRes.json().catch(() => ({}))
      if (!presignRes.ok) { setLogoError(presignData?.error ?? "Failed to get upload URL"); return }

      // 2. PUT directly to S3/R2
      const uploadRes = await fetch(presignData.uploadUrl, {
        method:  "PUT",
        headers: { "Content-Type": logoFile.type },
        body:    logoFile,
      })
      if (!uploadRes.ok) { setLogoError("Upload failed. Please try again."); return }

      setLogoUploaded(true)
      setLogoFile(null)
      // Keep preview — it reflects the new logo
    } finally {
      setUploadingLogo(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!team) return null

  const logoSrc = logoPreview ?? team.logoUrl

  return (
    <div className="mx-auto max-w-2xl">

      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/team/${teamId}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit -ml-2 gap-1.5 text-muted-foreground mb-2")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {team.name}
        </Link>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Team Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your team profile, branding, and links.
        </p>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── Logo ────────────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
            Team Logo
          </h2>

          <div className="flex items-center gap-5">
            {/* Preview */}
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-border text-lg font-bold text-white overflow-hidden"
              style={{ backgroundColor: primaryColor || team.primaryColor || "oklch(0.50 0.20 15)" }}
            >
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoSrc} alt="Team logo" className="h-full w-full object-cover" />
              ) : (
                team.name.slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP, or SVG · Max 5 MB
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {logoFile ? "Change file" : "Choose file"}
                </button>

                {logoFile && !logoUploaded && (
                  <button
                    type="button"
                    onClick={handleLogoUpload}
                    disabled={uploadingLogo}
                    className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
                  >
                    {uploadingLogo
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Upload className="h-3.5 w-3.5" />}
                    {uploadingLogo ? "Uploading…" : "Upload"}
                  </button>
                )}

                {logoUploaded && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                    <Check className="h-3.5 w-3.5" /> Logo updated
                  </span>
                )}
              </div>

              {logoFile && (
                <p className="text-xs text-muted-foreground truncate">{logoFile.name}</p>
              )}
              {logoError && (
                <p className="text-xs text-destructive">{logoError}</p>
              )}
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
        </section>

        {/* ── Info form ───────────────────────────────────────────── */}
        <form onSubmit={handleSave} className="flex flex-col gap-6">

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              Identity
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Team Name" required error={fieldErrors.name?.[0]}>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              Branding
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Primary Color" error={fieldErrors.primaryColor?.[0]}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor || "#C0273A"}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded-md border border-input bg-background p-1"
                  />
                  <input
                    type="text"
                    placeholder="#C0273A"
                    maxLength={7}
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </Field>
              <Field label="Secondary Color" error={fieldErrors.secondaryColor?.[0]}>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor || "#1B2A4A"}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-10 cursor-pointer rounded-md border border-input bg-background p-1"
                  />
                  <input
                    type="text"
                    placeholder="#1B2A4A"
                    maxLength={7}
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </Field>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-5">
              Links <span className="normal-case font-normal tracking-normal text-muted-foreground/60">(all optional)</span>
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Website" error={fieldErrors.website?.[0]}>
                <input
                  type="url"
                  placeholder="https://yourteam.gg"
                  maxLength={255}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Twitter / X Handle" error={fieldErrors.twitterHandle?.[0]}>
                <div className="flex items-center">
                  <span className="inline-flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                    @
                  </span>
                  <input
                    type="text"
                    placeholder="C3EsportsRL"
                    maxLength={15}
                    value={twitterHandle}
                    onChange={(e) => setTwitterHandle(e.target.value.replace(/^@/, ""))}
                    className={cn(inputCls, "rounded-l-none")}
                  />
                </div>
              </Field>
              <Field label="Discord Server Invite" error={fieldErrors.discordInvite?.[0]}>
                <input
                  type="url"
                  placeholder="https://discord.gg/yourserver"
                  maxLength={255}
                  value={discordInvite}
                  onChange={(e) => setDiscordInvite(e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </section>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pb-2">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                <Check className="h-4 w-4" /> Saved
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className={cn(buttonVariants({ size: "lg" }), "px-8 gap-2")}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Field wrapper
// ---------------------------------------------------------------------------

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}{required && <span className="ml-0.5 text-brand">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
