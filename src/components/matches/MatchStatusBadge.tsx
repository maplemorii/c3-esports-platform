import { cn } from "@/lib/utils"
import type { MatchStatus } from "@prisma/client"

export const STATUS_LABEL: Record<MatchStatus, string> = {
  SCHEDULED:      "Scheduled",
  CHECKING_IN:    "Check-in",
  IN_PROGRESS:    "Live",
  MATCH_FINISHED: "Finished",
  VERIFYING:      "Verifying",
  COMPLETED:      "Final",
  DISPUTED:       "Disputed",
  FORFEITED:      "Forfeit",
  NO_SHOW:        "No Show",
  CANCELLED:      "Cancelled",
}

const STATUS_CLASSES: Record<MatchStatus, string> = {
  SCHEDULED:      "bg-muted text-muted-foreground",
  CHECKING_IN:    "bg-sky-500/15 text-sky-400",
  IN_PROGRESS:    "bg-emerald-500/15 text-emerald-400",
  MATCH_FINISHED: "bg-amber-500/15 text-amber-400",
  VERIFYING:      "bg-amber-500/15 text-amber-400",
  COMPLETED:      "bg-muted text-muted-foreground",
  DISPUTED:       "bg-destructive/15 text-destructive",
  FORFEITED:      "bg-muted text-muted-foreground",
  NO_SHOW:        "bg-muted text-muted-foreground",
  CANCELLED:      "bg-muted/50 text-muted-foreground/50",
}

export default function MatchStatusBadge({
  status,
  size = "sm",
}: {
  status: MatchStatus
  size?: "xs" | "sm"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold uppercase tracking-wide",
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
        STATUS_CLASSES[status],
        status === "IN_PROGRESS" && "animate-pulse",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
