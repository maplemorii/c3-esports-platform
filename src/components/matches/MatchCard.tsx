import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/utils/dates"
import MatchStatusBadge from "./MatchStatusBadge"
import type { MatchStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MatchCardData = {
  id:         string
  status:     MatchStatus
  format:     string
  scheduledAt: Date | string | null
  homeScore:  number | null
  awayScore:  number | null
  homeTeam: { id: string; name: string; slug: string; logoUrl: string | null; primaryColor: string | null }
  awayTeam: { id: string; name: string; slug: string; logoUrl: string | null; primaryColor: string | null }
  winner?:    { id: string } | null
}

// ---------------------------------------------------------------------------
// TeamSide
// ---------------------------------------------------------------------------

function TeamSide({
  team,
  score,
  side,
  isWinner,
}: {
  team:     MatchCardData["homeTeam"]
  score:    number | null
  side:     "home" | "away"
  isWinner: boolean
}) {
  return (
    <div className={cn(
      "flex items-center gap-2.5 flex-1 min-w-0",
      side === "away" && "flex-row-reverse",
    )}>
      <div
        className="h-8 w-8 shrink-0 rounded overflow-hidden flex items-center justify-center text-[10px] font-bold text-white"
        style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
      >
        {team.logoUrl
          ? <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
          : team.name.slice(0, 2).toUpperCase()
        }
      </div>
      <span className={cn(
        "truncate text-sm font-semibold",
        side === "away" && "text-right",
        !isWinner && score !== null && "text-muted-foreground",
      )}>
        {team.name}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MatchCard
// ---------------------------------------------------------------------------

export default function MatchCard({ match }: { match: MatchCardData }) {
  const hasScore = match.homeScore !== null && match.awayScore !== null
  const isDone   = match.status === "COMPLETED" || match.status === "FORFEITED"
  const homeWon  = isDone && hasScore && match.homeScore! > match.awayScore!
  const awayWon  = isDone && hasScore && match.awayScore! > match.homeScore!

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 hover:border-brand/40 hover:bg-brand/[0.02] transition-colors"
    >
      {/* Home team */}
      <TeamSide team={match.homeTeam} score={match.homeScore} side="home" isWinner={homeWon} />

      {/* Center — score or status */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 px-1 min-w-[100px]">
        {hasScore ? (
          <div className="flex items-baseline gap-2 font-display font-black tabular-nums leading-none">
            <span className={cn("text-2xl", homeWon ? "text-emerald-400" : "")}>{match.homeScore}</span>
            <span className="text-base text-muted-foreground/40">–</span>
            <span className={cn("text-2xl", awayWon ? "text-emerald-400" : "")}>{match.awayScore}</span>
          </div>
        ) : (
          <MatchStatusBadge status={match.status} size="xs" />
        )}
        {hasScore && <MatchStatusBadge status={match.status} size="xs" />}
        <span className="text-[10px] text-muted-foreground">{match.format}</span>
        {match.scheduledAt && match.status === "SCHEDULED" && (
          <span className="text-[10px] text-muted-foreground text-center leading-tight">
            {formatDateTime(match.scheduledAt)}
          </span>
        )}
      </div>

      {/* Away team */}
      <TeamSide team={match.awayTeam} score={match.awayScore} side="away" isWinner={awayWon} />
    </Link>
  )
}
