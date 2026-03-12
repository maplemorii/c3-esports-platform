"use client"

/**
 * EpicLinkButton
 *
 * Shows "Link via Epic Games" (redirects to /api/auth/epic) or
 * "Unlink" (calls DELETE /api/auth/epic) in the Epic Games AccountRow
 * on the profile page.
 */

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Link2, Link2Off } from "lucide-react"

interface EpicLinkButtonProps {
  epicUsername: string | null
}

export function EpicLinkButton({ epicUsername }: EpicLinkButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleUnlink() {
    if (!confirm("Unlink your Epic Games account?")) return
    setBusy(true)
    try {
      const res = await fetch("/api/auth/epic", { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (epicUsername) {
    return (
      <button
        onClick={handleUnlink}
        disabled={busy}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50 disabled:cursor-wait"
        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
        Unlink
      </button>
    )
  }

  return (
    <Link
      href="/api/auth/epic"
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-400 transition-colors hover:text-sky-300"
      style={{
        background: "rgba(14,165,233,0.06)",
        border: "1px solid rgba(14,165,233,0.2)",
      }}
    >
      <Link2 className="h-3 w-3" />
      Link via Epic
    </Link>
  )
}
