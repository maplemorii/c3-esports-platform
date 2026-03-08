/**
 * useStandings.ts
 *
 * SWR hooks for standings data.
 *
 * Usage:
 *   const { rows, isLoading } = useStandings("division-id-xyz")
 *   const { standings, isLoading } = useSeasonStandings("season-id-abc")
 */

"use client"

import useSWR from "swr"
import type { DivisionStandings, SeasonStandings } from "@/types"

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// useStandings — single division
// ---------------------------------------------------------------------------

export interface UseStandingsResult {
  standings: DivisionStandings | null
  isLoading: boolean
  error:     Error | null
  mutate:    () => void
}

export function useStandings(divisionId: string | null | undefined): UseStandingsResult {
  const { data, error, isLoading, mutate } = useSWR<DivisionStandings>(
    divisionId ? `/api/divisions/${divisionId}/standings` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60_000 } // refresh every minute
  )

  return {
    standings: data ?? null,
    isLoading,
    error:     error ?? null,
    mutate,
  }
}

// ---------------------------------------------------------------------------
// useSeasonStandings — all divisions for a season
// ---------------------------------------------------------------------------

export interface UseSeasonStandingsResult {
  standings: SeasonStandings | null
  isLoading: boolean
  error:     Error | null
  mutate:    () => void
}

export function useSeasonStandings(seasonId: string | null | undefined): UseSeasonStandingsResult {
  const { data, error, isLoading, mutate } = useSWR<SeasonStandings>(
    seasonId ? `/api/seasons/${seasonId}/standings` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 60_000 }
  )

  return {
    standings: data ?? null,
    isLoading,
    error:     error ?? null,
    mutate,
  }
}
