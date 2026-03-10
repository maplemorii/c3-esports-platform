"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Loader2, CheckCircle2 } from "lucide-react"

type UploadStep = "idle" | "presigning" | "uploading" | "submitting" | "done" | "error"

export default function ReplaySlot({
  matchId,
  gameNumber,
}: {
  matchId: string
  gameNumber: number
}) {
  const router   = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [step, setStep]       = useState<UploadStep>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError]     = useState<string | null>(null)

  function reset() {
    setStep("idle")
    setProgress(0)
    setError(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  async function handleFile(file: File) {
    if (!file.name.endsWith(".replay")) {
      setError("Only .replay files are supported.")
      return
    }
    setError(null)

    // 1. Presign
    setStep("presigning")
    const presignRes = await fetch("/api/upload/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename:    file.name,
        contentType: "application/octet-stream",
        category:    "replay",
      }),
    })
    if (!presignRes.ok) {
      const body = await presignRes.json().catch(() => ({}))
      setError(body.message ?? "Failed to get upload URL.")
      setStep("error")
      return
    }
    const { uploadUrl, fileKey } = await presignRes.json() as { uploadUrl: string; fileKey: string }

    // 2. Upload directly to storage
    setStep("uploading")
    try {
      const xhr = new XMLHttpRequest()
      await new Promise<void>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)))
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

    // 3. Register replay with the API
    setStep("submitting")
    const submitRes = await fetch(`/api/matches/${matchId}/replays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameNumber, fileKey }),
    })
    if (!submitRes.ok) {
      const body = await submitRes.json().catch(() => ({}))
      setError(body.message ?? "Failed to register replay.")
      setStep("error")
      return
    }

    setStep("done")
    router.refresh()
  }

  if (step === "done") {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Uploaded — processing…
      </div>
    )
  }

  if (step === "error") {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-xs text-destructive">{error}</p>
        <button
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 text-left"
        >
          Try again
        </button>
      </div>
    )
  }

  const isLoading = step !== "idle"

  const stepLabel: Record<UploadStep, string> = {
    idle:       "Upload Replay",
    presigning: "Preparing…",
    uploading:  progress > 0 ? `Uploading ${progress}%` : "Uploading…",
    submitting: "Registering…",
    done:       "Done",
    error:      "Error",
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".replay"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-brand hover:text-brand disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Upload className="h-3 w-3" />
        }
        {stepLabel[step]}
      </button>
    </>
  )
}
