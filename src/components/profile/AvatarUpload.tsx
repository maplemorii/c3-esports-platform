"use client"

/**
 * AvatarUpload
 *
 * Click-to-upload avatar component for the profile edit page.
 * Flow:
 *   1. User clicks the avatar area → file picker opens
 *   2. File selected → POST /api/upload/presign (category=avatar)
 *   3. PUT file bytes to presigned URL
 *   4. PATCH /api/players/:playerId with { avatarUrl: publicUrl }
 *   5. Router refresh to reflect the new avatar in the server component
 */

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, UserRound, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

interface AvatarUploadProps {
  playerId:         string
  currentAvatarUrl: string | null
  hasDiscordOAuth:  boolean
}

export function AvatarUpload({ playerId, currentAvatarUrl, hasDiscordOAuth }: AvatarUploadProps) {
  const router    = useRouter()
  const inputRef  = useRef<HTMLInputElement>(null)
  const [preview, setPreview]   = useState<string | null>(currentAvatarUrl)
  const [error,   setError]     = useState<string | null>(null)
  const [phase,   setPhase]     = useState<"idle" | "uploading" | "saving">("idle")
  const [,        startTransition] = useTransition()

  const busy = phase !== "idle"

  async function handleFile(file: File) {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed.")
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_SIZE_MB} MB.`)
      return
    }

    // Optimistic preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setPhase("uploading")

    try {
      // 1. Get presigned upload URL
      const presignRes = await fetch("/api/upload/presign", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          filename:    file.name,
          contentType: file.type,
          category:    "avatar",
        }),
      })
      if (!presignRes.ok) throw new Error("Failed to get upload URL")
      const { uploadUrl, publicUrl } = await presignRes.json()

      // 2. PUT file directly to R2/S3
      const uploadRes = await fetch(uploadUrl, {
        method:  "PUT",
        headers: { "Content-Type": file.type },
        body:    file,
      })
      if (!uploadRes.ok) throw new Error("File upload failed")

      setPhase("saving")

      // 3. Save the public URL on the player record
      const patchRes = await fetch(`/api/players/${playerId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ avatarUrl: publicUrl }),
      })
      if (!patchRes.ok) throw new Error("Failed to save avatar")

      // 4. Refresh server component data
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
      setPreview(currentAvatarUrl) // revert preview
    } finally {
      setPhase("idle")
      URL.revokeObjectURL(objectUrl)
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so the same file can be re-selected if needed
    e.target.value = ""
  }

  function onDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar button */}
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        aria-label="Change profile photo"
        className={cn(
          "group relative flex h-24 w-24 shrink-0 items-center justify-center",
          "rounded-2xl border-2 border-border bg-muted overflow-hidden shadow-lg",
          "transition-all duration-150",
          busy ? "cursor-wait opacity-70" : "cursor-pointer hover:border-brand/50"
        )}
      >
        {/* Current/preview image */}
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Profile avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound className="h-12 w-12 text-muted-foreground/40" />
        )}

        {/* Hover / busy overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-2xl",
            "bg-black/50 transition-opacity",
            busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="sr-only"
        onChange={onInputChange}
        disabled={busy}
      />

      {/* Label + hint */}
      <div className="text-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="text-sm font-medium text-brand hover:underline disabled:opacity-50 disabled:cursor-wait"
        >
          {busy
            ? phase === "uploading" ? "Uploading…" : "Saving…"
            : preview ? "Change photo" : "Upload photo"}
        </button>
        <p className="mt-0.5 text-xs text-muted-foreground/60">
          {hasDiscordOAuth
            ? "Override your Discord avatar · JPEG, PNG, WebP · max 5 MB"
            : "JPEG, PNG, or WebP · max 5 MB"}
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
