"use client"

/**
 * ReplayUploader
 *
 * Unified component for a single replay slot in a match game row.
 * Handles:
 *  - Displaying existing replay status (PENDING, PROCESSING, SUCCESS, FAILED, MISMATCH)
 *  - Drag-and-drop + click-to-browse file upload
 *  - XHR upload with progress bar
 *  - Re-upload option for FAILED and PENDING slots
 */

import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Clock,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReplayParseStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "MISMATCH"

export type ExistingReplay = {
  parseStatus:      ReplayParseStatus
  parseError:       string | null
  ballchasingUrl:   string | null
  parsedHomeGoals:  number | null
  parsedAwayGoals:  number | null
  parsedOvertime:   boolean | null
  uploadedByTeamId: string | null
}

type UploadStep = "idle" | "presigning" | "uploading" | "submitting" | "queued" | "error"

type Props = {
  matchId:      string
  gameNumber:   number
  replay:       ExistingReplay | null
  homeTeamName: string
  awayTeamName: string
  canUpload:    boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

// ---------------------------------------------------------------------------
// Replay Status Display
// ---------------------------------------------------------------------------

function ReplayStatus({
  replay,
  homeTeamName,
  awayTeamName,
  onReUpload,
  canReUpload,
}: {
  replay: ExistingReplay
  homeTeamName: string
  awayTeamName: string
  onReUpload: () => void
  canReUpload: boolean
}) {
  const { parseStatus, ballchasingUrl, parsedHomeGoals, parsedAwayGoals, parsedOvertime, parseError } = replay

  if (parseStatus === "SUCCESS") {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </span>
          {ballchasingUrl && (
            <a
              href={ballchasingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-brand transition-colors"
            >
              ballchasing.com <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
        {parsedHomeGoals !== null && (
          <p className="text-xs text-muted-foreground">
            {homeTeamName} {parsedHomeGoals} – {parsedAwayGoals} {awayTeamName}
            {parsedOvertime && " (OT)"}
          </p>
        )}
      </div>
    )
  }

  if (parseStatus === "PROCESSING") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400">
          <Loader2 className="h-3 w-3 animate-spin" /> Processing
        </span>
        {ballchasingUrl && (
          <a
            href={ballchasingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-brand transition-colors"
          >
            ballchasing.com <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    )
  }

  if (parseStatus === "PENDING") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Clock className="h-3 w-3" /> Queued
        </span>
        {canReUpload && (
          <button
            onClick={onReUpload}
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            <RotateCcw className="h-2.5 w-2.5" /> Re-upload
          </button>
        )}
      </div>
    )
  }

  if (parseStatus === "MISMATCH") {
    return (
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
          <AlertTriangle className="h-3 w-3" /> Mismatch
        </span>
        {parsedHomeGoals !== null && (
          <p className="text-xs text-amber-400/80">
            Replay: {parsedHomeGoals} – {parsedAwayGoals}{parsedOvertime ? " OT" : ""}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Dispute opened — staff will review.</p>
      </div>
    )
  }

  // FAILED
  return (
    <div className="space-y-1.5">
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
        <XCircle className="h-3 w-3" /> Failed
      </span>
      {parseError && (
        <p className="text-xs text-muted-foreground line-clamp-2">{parseError}</p>
      )}
      {canReUpload && (
        <button
          onClick={onReUpload}
          className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand/80 transition-colors"
        >
          <RotateCcw className="h-3 w-3" /> Try again
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Upload Zone
// ---------------------------------------------------------------------------

function UploadZone({
  onFile,
  step,
  progress,
  fileName,
  error,
  onRetry,
}: {
  onFile: (file: File) => void
  step: UploadStep
  progress: number
  fileName: string | null
  error: string | null
  onRetry: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragging(false), [])

  if (step === "queued") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Uploaded — queued for processing
      </span>
    )
  }

  if (step === "error") {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-destructive">{error}</p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 text-left"
        >
          <RotateCcw className="h-3 w-3" /> Try again
        </button>
      </div>
    )
  }

  const isLoading = step !== "idle"

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".replay"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ""
        }}
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !isLoading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !isLoading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-3 text-center transition-colors",
          isLoading
            ? "cursor-default border-border"
            : dragging
              ? "border-brand bg-brand/5 cursor-copy"
              : "border-border hover:border-brand hover:bg-brand/5 cursor-pointer",
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {step === "presigning" && "Preparing…"}
              {step === "uploading" && (fileName ? `${fileName}` : "Uploading…")}
              {step === "submitting" && "Registering…"}
            </p>

            {/* Progress bar (shown during upload) */}
            {step === "uploading" && (
              <div className="w-full mt-1">
                <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{progress}%</p>
              </div>
            )}
          </>
        ) : (
          <>
            <Upload className={cn(
              "h-4 w-4 transition-colors",
              dragging ? "text-brand" : "text-muted-foreground group-hover:text-brand",
            )} />
            <p className={cn(
              "text-xs transition-colors",
              dragging ? "text-brand" : "text-muted-foreground group-hover:text-brand",
            )}>
              {dragging ? "Drop to upload" : "Upload .replay"}
            </p>
            {fileName && (
              <p className="text-[10px] text-muted-foreground truncate max-w-full">{fileName}</p>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ReplayUploader({
  matchId,
  gameNumber,
  replay,
  homeTeamName,
  awayTeamName,
  canUpload,
}: Props) {
  const router = useRouter()

  const [step, setStep]       = useState<UploadStep>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError]     = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)  // for re-upload on PENDING/FAILED

  function reset() {
    setStep("idle")
    setProgress(0)
    setError(null)
    setFileName(null)
  }

  async function handleFile(file: File) {
    if (!file.name.endsWith(".replay")) {
      setError("Only .replay files are accepted.")
      setStep("error")
      return
    }

    setFileName(file.name)
    setError(null)

    // 1. Get presigned URL
    setStep("presigning")
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, contentType: "application/octet-stream", category: "replay" }),
    })
    if (!presignRes.ok) {
      const body = await presignRes.json().catch(() => ({}))
      setError(body.message ?? "Failed to get upload URL.")
      setStep("error")
      return
    }
    const { uploadUrl, fileKey } = await presignRes.json() as { uploadUrl: string; fileKey: string }

    // 2. Upload to storage
    setStep("uploading")
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload  = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)))
        xhr.onerror = () => reject(new Error("Network error during upload"))
        xhr.open("PUT", uploadUrl)
        xhr.setRequestHeader("Content-Type", "application/octet-stream")
        xhr.send(file)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
      setStep("error")
      return
    }

    // 3. Register with API
    setStep("submitting")
    const regRes = await fetch(`/api/matches/${matchId}/replays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameNumber, fileKey }),
    })
    if (!regRes.ok) {
      const body = await regRes.json().catch(() => ({}))
      setError(body.message ?? "Failed to register replay.")
      setStep("error")
      return
    }

    setStep("queued")
    setShowUpload(false)
    router.refresh()
  }

  // If a successful or mismatch replay exists, show its status only (no upload UI)
  const lockStates: ReplayParseStatus[] = ["SUCCESS", "MISMATCH"]
  const isLocked = replay && lockStates.includes(replay.parseStatus)

  // Show status for existing replay, unless user clicked re-upload
  if (replay && !showUpload) {
    return (
      <ReplayStatus
        replay={replay}
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        canReUpload={canUpload && !isLocked}
        onReUpload={() => { setShowUpload(true); reset() }}
      />
    )
  }

  // No replay or re-uploading
  if (canUpload) {
    return (
      <div className="space-y-1.5">
        {showUpload && replay && (
          <button
            onClick={() => { setShowUpload(false); reset() }}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Cancel
          </button>
        )}
        <UploadZone
          onFile={handleFile}
          step={step}
          progress={progress}
          fileName={fileName}
          error={error}
          onRetry={reset}
        />
      </div>
    )
  }

  return <p className="text-xs text-muted-foreground/50">No replay uploaded</p>
}
