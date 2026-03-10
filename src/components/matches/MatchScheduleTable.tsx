import { Swords } from "lucide-react"
import { formatDate } from "@/lib/utils/dates"
import MatchCard, { type MatchCardData } from "./MatchCard"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WeekMeta = {
  weekNumber: number
  label:      string | null
  startDate:  Date | string | null
}

export type ScheduledMatch = MatchCardData & {
  leagueWeek: WeekMeta | null
}

// ---------------------------------------------------------------------------
// MatchScheduleTable
// ---------------------------------------------------------------------------

export default function MatchScheduleTable({ matches }: { matches: ScheduledMatch[] }) {
  // Group matches by week number
  type Group = { meta: WeekMeta; matches: ScheduledMatch[] }
  const groupMap = new Map<number, Group>()

  for (const match of matches) {
    const wn = match.leagueWeek?.weekNumber ?? 0
    if (!groupMap.has(wn)) {
      groupMap.set(wn, {
        meta:    match.leagueWeek ?? { weekNumber: wn, label: null, startDate: null },
        matches: [],
      })
    }
    groupMap.get(wn)!.matches.push(match)
  }

  const groups = Array.from(groupMap.values()).sort((a, b) => a.meta.weekNumber - b.meta.weekNumber)

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Swords className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-muted-foreground">No matches scheduled yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.meta.weekNumber}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {group.meta.weekNumber === 0
                ? "Unscheduled"
                : group.meta.label ?? `Week ${group.meta.weekNumber}`}
            </h2>
            {group.meta.startDate && (
              <span className="text-xs text-muted-foreground">
                {formatDate(group.meta.startDate)}
              </span>
            )}
          </div>
          <ul className="space-y-2">
            {group.matches.map((match) => (
              <li key={match.id}>
                <MatchCard match={match} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
