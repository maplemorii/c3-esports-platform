"use client"

/**
 * DivisionManager
 *
 * Inline list of a season's divisions with edit-in-place support.
 * Staff can update each division's maxTeams and bracketType.
 * Rendered inside admin season detail pages.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Pencil, Check, X, Loader2, Users, GitBranch } from "lucide-react"
import type { BracketType, DivisionTier } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DivisionRow {
  id:          string
  name:        string
  tier:        DivisionTier
  description: string | null
  maxTeams:    number | null
  bracketType: BracketType
  registrationCount: number
}

interface Props {
  seasonId:  string
  divisions: DivisionRow[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:    "Premier",
  CHALLENGERS: "Open Challengers",
  CONTENDERS: "Open Contenders",
}

const TIER_ACCENT: Record<DivisionTier, string> = {
  PREMIER:    "border-amber-500/30 bg-amber-500/5",
  CHALLENGERS:"border-sky-500/30 bg-sky-500/5",
  CONTENDERS: "border-brand/20 bg-brand/5",
}

const BRACKET_TYPES: BracketType[] = [
  "DOUBLE_ELIMINATION",
  "SINGLE_ELIMINATION",
  "SWISS",
  "GSL",
  "ROUND_ROBIN",
]

const BRACKET_LABEL: Record<BracketType, string> = {
  DOUBLE_ELIMINATION: "Double Elimination",
  SINGLE_ELIMINATION: "Single Elimination",
  SWISS:              "Swiss",
  GSL:                "GSL",
  ROUND_ROBIN:        "Round Robin",
}

// ---------------------------------------------------------------------------
// DivisionRow (single editable row)
// ---------------------------------------------------------------------------

function DivisionRowItem({
  division,
  seasonId,
}: {
  division: DivisionRow
  seasonId: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [maxTeams, setMaxTeams] = useState<string>(division.maxTeams?.toString() ?? "")
  const [bracketType, setBracketType] = useState<BracketType>(division.bracketType)
  const [description, setDescription] = useState(division.description ?? "")
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/seasons/${seasonId}/divisions/${division.id}`,
        {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            description: description || undefined,
            maxTeams:    maxTeams ? parseInt(maxTeams, 10) : undefined,
            bracketType,
          }),
        }
      )
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setMaxTeams(division.maxTeams?.toString() ?? "")
    setBracketType(division.bracketType)
    setDescription(division.description ?? "")
    setEditing(false)
    setError(null)
  }

  const INPUT_CLS = cn(
    "rounded-md border border-border bg-background px-2.5 py-1.5 text-sm",
    "focus:outline-none focus:ring-1 focus:ring-brand/40",
    "disabled:opacity-50"
  )

  return (
    <div className={cn("rounded-xl border p-4", TIER_ACCENT[division.tier])}>
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {TIER_LABEL[division.tier]}
          </p>
          <h3 className="font-display text-base font-bold uppercase tracking-wide">
            {division.name}
          </h3>
        </div>

        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:border-brand/40 hover:text-brand transition-colors"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}

        {editing && (
          <div className="flex gap-1.5">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 rounded-md bg-brand px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save
            </button>
            <button
              onClick={cancel}
              disabled={saving}
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:border-destructive/40 hover:text-destructive transition-colors disabled:opacity-50"
            >
              <X className="h-3 w-3" />
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {/* Max teams */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
          {editing ? (
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground whitespace-nowrap">Max teams</label>
              <input
                type="number"
                min={2}
                max={256}
                value={maxTeams}
                onChange={(e) => setMaxTeams(e.target.value)}
                placeholder="Unlimited"
                disabled={saving}
                className={cn(INPUT_CLS, "w-24")}
              />
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">
              <span className="font-semibold text-foreground">
                {division.registrationCount}
              </span>
              {division.maxTeams ? `/${division.maxTeams}` : ""} teams
            </span>
          )}
        </div>

        {/* Bracket type */}
        <div className="flex items-center gap-2 text-sm">
          <GitBranch className="h-4 w-4 shrink-0 text-muted-foreground" />
          {editing ? (
            <select
              value={bracketType}
              onChange={(e) => setBracketType(e.target.value as BracketType)}
              disabled={saving}
              className={INPUT_CLS}
            >
              {BRACKET_TYPES.map((bt) => (
                <option key={bt} value={bt}>{BRACKET_LABEL[bt]}</option>
              ))}
            </select>
          ) : (
            <span className="text-muted-foreground">
              {BRACKET_LABEL[division.bracketType]}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {editing && (
        <div className="mt-3">
          <label className="mb-1 block text-xs text-muted-foreground">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            disabled={saving}
            placeholder="Short description of this division…"
            className={cn(INPUT_CLS, "w-full resize-none")}
          />
        </div>
      )}

      {!editing && division.description && (
        <p className="mt-2 text-sm text-muted-foreground">{division.description}</p>
      )}

      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function DivisionManager({ seasonId, divisions }: Props) {
  if (divisions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No divisions yet. They will be created automatically when the season is saved.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {divisions.map((div) => (
        <DivisionRowItem key={div.id} division={div} seasonId={seasonId} />
      ))}
    </div>
  )
}
