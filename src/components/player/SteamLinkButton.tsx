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
import { useRouter } from "next/navigation"
import { Loader2, Link2, Link2Off } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

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
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "mt-2 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
        )}
      >
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
        Unlink
      </button>
    )
  }

  return (
    <a
      href="/api/auth/steam"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "mt-2 gap-1.5 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
      )}
    >
      <Link2 className="h-3 w-3" />
      Link via Steam
    </a>
  )
}
