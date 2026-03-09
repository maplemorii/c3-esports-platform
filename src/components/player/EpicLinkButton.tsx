"use client"

/**
 * EpicLinkButton
 *
 * Shows "Link via Epic Games" (redirects to /api/auth/epic) or
 * "Unlink" (calls DELETE /api/auth/epic) in the Epic Games AccountRow
 * on the profile page.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Link2, Link2Off } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

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
      href="/api/auth/epic"
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "mt-2 gap-1.5 text-xs border-sky-500/30 text-sky-400 hover:bg-sky-500/10 hover:text-sky-300"
      )}
    >
      <Link2 className="h-3 w-3" />
      Link via Epic
    </a>
  )
}
