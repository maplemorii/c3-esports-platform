"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, AlertTriangle, Trash2, CalendarDays } from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  divisionId: string
  divisionName: string
  seasonId: string
  teamCount: number
  weekCount: number
  scheduleGeneratedAt: Date | null
  matchCount: number
  scheduleMode: string | null
}

type ScheduleMode = "FULL_RR" | "PARTIAL_RR" | "DOUBLE_RR"

interface PreviewResult {
  matchesCreated: number
  rounds: number
  weeksAvailable: number
  fairnessScore: number
  byeWeeks: string[]
}

const MODE_LABELS: Record<ScheduleMode, string> = {
  FULL_RR: "Full Round Robin",
  PARTIAL_RR: "Partial Round Robin",
  DOUBLE_RR: "Double Round Robin",
}

const MODE_DESC: Record<ScheduleMode, string> = {
  FULL_RR: "Every team plays each other once (N−1 rounds)",
  PARTIAL_RR: "Seed-balanced partial schedule (≤ weeks available)",
  DOUBLE_RR: "Every team plays each other twice (2×(N−1) rounds)",
}

// ---------------------------------------------------------------------------
// Helper — pick a sensible default mode
// ---------------------------------------------------------------------------

function defaultMode(teamCount: number, weekCount: number): ScheduleMode {
  const needed = teamCount - 1
  if (weekCount >= needed * 2) return "DOUBLE_RR"
  if (weekCount >= needed) return "FULL_RR"
  return "PARTIAL_RR"
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SchedulePanel({
  divisionId,
  divisionName,
  seasonId,
  teamCount,
  weekCount,
  scheduleGeneratedAt,
  matchCount,
  scheduleMode,
}: Props) {
  const router = useRouter()

  const [mode, setMode] = useState<ScheduleMode>(
    defaultMode(teamCount, weekCount)
  )
  const [loading, setLoading] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const baseUrl = `/api/admin/seasons/${seasonId}/divisions/${divisionId}`

  // ---- Preview ----
  async function handlePreview() {
    setLoading(true)
    setError(null)
    setPreview(null)
    try {
      const res = await fetch(`${baseUrl}/schedule/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, preview: true }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Preview failed")
        return
      }
      setPreview(data as PreviewResult)
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  // ---- Confirm & Generate ----
  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/schedule/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, preview: false }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Generation failed")
        return
      }
      setPreview(null)
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  // ---- Clear ----
  async function handleClear() {
    if (
      !confirm(
        `Clear the schedule for "${divisionName}"? This will delete all SCHEDULED matches and cannot be undone.`
      )
    )
      return

    setClearing(true)
    setError(null)
    try {
      const res = await fetch(`${baseUrl}/schedule`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Clear failed")
        return
      }
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setClearing(false)
    }
  }

  // ----------------------------------------------------------------
  // Render — schedule already generated
  // ----------------------------------------------------------------

  if (scheduleGeneratedAt) {
    const generatedDate = new Date(scheduleGeneratedAt).toLocaleDateString(
      "en-US",
      { month: "short", day: "numeric", year: "numeric" }
    )
    const modeLabel =
      scheduleMode && scheduleMode in MODE_LABELS
        ? MODE_LABELS[scheduleMode as ScheduleMode]
        : scheduleMode ?? "Unknown"

    return (
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" style={{ color: "rgba(196,28,53,0.9)" }} />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Schedule
            </span>
          </div>
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{
              background: "rgba(34,197,94,0.12)",
              color: "rgb(74,222,128)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Generated
          </span>
        </div>

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Matches</span>
            <span className="font-semibold">{matchCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mode</span>
            <span className="font-medium">{modeLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Generated</span>
            <span className="font-medium">{generatedDate}</span>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {error}
          </p>
        )}

        <button
          onClick={handleClear}
          disabled={clearing}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
          style={{
            border: "1px solid rgba(239,68,68,0.3)",
            color: "rgb(248,113,113)",
            background: "rgba(239,68,68,0.08)",
          }}
        >
          {clearing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Clear Schedule
        </button>
      </div>
    )
  }

  // ----------------------------------------------------------------
  // Render — no schedule yet
  // ----------------------------------------------------------------

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 shrink-0" style={{ color: "rgba(196,28,53,0.9)" }} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Schedule
        </span>
      </div>

      {/* Mode selector */}
      <div className="space-y-1.5">
        {(["FULL_RR", "PARTIAL_RR", "DOUBLE_RR"] as ScheduleMode[]).map((m) => (
          <label
            key={m}
            className="flex items-start gap-2.5 cursor-pointer rounded-lg px-3 py-2 transition-colors"
            style={{
              border: `1px solid ${mode === m ? "rgba(196,28,53,0.4)" : "rgba(255,255,255,0.06)"}`,
              background: mode === m ? "rgba(196,28,53,0.08)" : "transparent",
            }}
          >
            <input
              type="radio"
              name={`mode-${divisionId}`}
              value={m}
              checked={mode === m}
              onChange={() => {
                setMode(m)
                setPreview(null)
                setError(null)
              }}
              className="mt-0.5 accent-red-600"
            />
            <div>
              <p className="text-xs font-semibold">{MODE_LABELS[m]}</p>
              <p className="text-[10px] text-muted-foreground">{MODE_DESC[m]}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Preview result card */}
      {preview && (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{
            border: "1px solid rgba(59,130,246,0.25)",
            background: "rgba(59,130,246,0.06)",
          }}
        >
          <p className="text-xs font-semibold text-sky-300">Preview</p>
          <div className="text-xs space-y-1">
            <p className="font-medium">
              {preview.matchesCreated} match{preview.matchesCreated !== 1 ? "es" : ""} across{" "}
              {preview.rounds} round{preview.rounds !== 1 ? "s" : ""}
            </p>
            <p className="text-muted-foreground">
              Fairness score:{" "}
              <span className="text-foreground font-medium">{preview.fairnessScore}</span>{" "}
              <span className="text-[10px]">(lower = better)</span>
            </p>
            {preview.byeWeeks.length > 0 && (
              <p className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                Some teams will receive a bye week (odd team count)
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50 transition-opacity"
              style={{
                background:
                  "linear-gradient(135deg, rgba(196,28,53,0.9) 0%, rgba(220,38,38,0.8) 100%)",
              }}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Confirm & Generate
            </button>
            <button
              onClick={() => setPreview(null)}
              disabled={loading}
              className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}

      {/* Generate button (shows preview first) */}
      {!preview && (
        <button
          onClick={handlePreview}
          disabled={loading || teamCount < 2}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-bold text-white transition-opacity disabled:opacity-40"
          style={{
            background:
              "linear-gradient(135deg, rgba(196,28,53,0.85) 0%, rgba(220,38,38,0.75) 100%)",
          }}
          title={teamCount < 2 ? "Need at least 2 approved teams" : undefined}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CalendarDays className="h-3.5 w-3.5" />
          )}
          {loading ? "Generating preview…" : "Generate Schedule"}
        </button>
      )}

      {teamCount < 2 && (
        <p className="text-[10px] text-muted-foreground text-center">
          At least 2 approved teams required
        </p>
      )}
    </div>
  )
}
