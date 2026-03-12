"use client"

/**
 * SteamLinkButton
 *
 * Client component rendered inside the Steam AccountRow on the profile page.
 * Shows "Link via Steam" (redirects to /api/auth/steam) or
 * "Unlink" (calls DELETE /api/auth/steam) depending on whether a Steam ID
 * is already saved.
 */

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, Link2, Link2Off } from "lucide-react"

interface SteamLinkButtonProps {
  steamId: string | null
}

export function SteamLinkButton({ steamId }: SteamLinkButtonProps) {
  const router  = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleUnlink() {
    if (!confirm("Unlink your Steam account?")) return
    setBusy(true)
    try {
      const res = await fetch("/api/auth/steam", { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (steamId) {
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
      href="/api/auth/steam"
      className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
      style={{
        background: "rgba(59,130,246,0.06)",
        border: "1px solid rgba(59,130,246,0.2)",
      }}
    >
      <Link2 className="h-3 w-3" />
      Link via Steam
    </Link>
  )
}
