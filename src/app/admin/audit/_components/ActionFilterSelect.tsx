"use client"

export function ActionFilterSelect({
  actions,
  current,
  entityType,
}: {
  actions: string[]
  current?: string
  entityType?: string
}) {
  const ACTION_LABELS: Record<string, string> = {
    MATCH_RESULT_OVERRIDE:          "Score Override",
    MATCH_FORFEITED:                "Match Forfeited",
    MATCH_CANCELLED:                "Match Cancelled",
    MATCH_FORCE_CHECKIN:            "Force Check-In",
    MATCH_RESCHEDULED:              "Match Rescheduled",
    TEAM_REGISTRATION_APPROVED:     "Registration Approved",
    TEAM_REGISTRATION_REJECTED:     "Registration Rejected",
    DISPUTE_RESOLVED:               "Dispute Resolved",
    DISPUTE_DISMISSED:              "Dispute Dismissed",
    USER_ROLE_CHANGED:              "Role Changed",
    EDU_OVERRIDE_APPROVED:          "Edu Override Approved",
    EDU_OVERRIDE_REVOKED:           "Edu Override Revoked",
    STANDINGS_RECALCULATED:         "Standings Recalculated",
    SEASON_STATUS_CHANGED:          "Season Status Changed",
  }

  return (
    <form method="GET" action="/admin/audit">
      {entityType && <input type="hidden" name="entityType" value={entityType} />}
      <select
        name="action"
        defaultValue={current ?? ""}
        onChange={(e) => (e.currentTarget.form as HTMLFormElement).submit()}
        className="rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
      >
        <option value="">All actions</option>
        {actions.map((a) => (
          <option key={a} value={a}>
            {ACTION_LABELS[a] ?? a}
          </option>
        ))}
      </select>
    </form>
  )
}
