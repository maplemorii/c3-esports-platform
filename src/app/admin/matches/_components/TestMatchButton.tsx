"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FlaskConical, Loader2 } from "lucide-react"

export function TestMatchButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleCreate() {
    setBusy(true)
    try {
      const res = await fetch("/api/admin/dev/test-match", { method: "POST" })
      const data = await res.json()
      if (data.url) router.push(data.url)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleCreate}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground disabled:opacity-50 disabled:cursor-wait shrink-0"
      title="Creates an IN_PROGRESS test match for replay/flow testing"
    >
      {busy
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <FlaskConical className="h-3.5 w-3.5" />
      }
      Test Match
    </button>
  )
}
