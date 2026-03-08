/**
 * useMatches.ts
 *
 * SWR hooks for match data.
 *
 * Usage:
 *   const { match, isLoading } = useMatch("match-id-xyz")
 *   const { matches } = useMatches({ teamId: "team-abc", upcoming: true })
 */

"use client"

import useSWR from "swr"
import type { MatchResponse, MatchSummary, PaginatedResponse, MatchQueryParams } from "@/types"

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
// useMatch — single match detail
// ---------------------------------------------------------------------------

export interface UseMatchResult {
  match:     MatchResponse | null
  isLoading: boolean
  error:     Error | null
  mutate:    () => void
}

export function useMatch(matchId: string | null | undefined): UseMatchResult {
  const { data, error, isLoading, mutate } = useSWR<MatchResponse>(
    matchId ? `/api/matches/${matchId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      // Refresh frequently while match is in-progress or verifying
      refreshInterval: 30_000,
    }
  )

  return {
    match:     data ?? null,
    isLoading,
    error:     error ?? null,
    mutate,
  }
}

// ---------------------------------------------------------------------------
// useMatches — filtered + paginated list
// ---------------------------------------------------------------------------

export interface UseMatchesResult {
  matches:    MatchSummary[]
  total:      number
  totalPages: number
  isLoading:  boolean
  error:      Error | null
  mutate:     () => void
}

function buildMatchesUrl(params: MatchQueryParams): string {
  const q = new URLSearchParams()
  if (params.divisionId)             q.set("divisionId", params.divisionId)
  if (params.weekId)                 q.set("weekId",     params.weekId)
  if (params.status)                 q.set("status",     params.status)
  if (params.teamId)                 q.set("teamId",     params.teamId)
  if (params.upcoming !== undefined) q.set("upcoming",   String(params.upcoming))
  if (params.page)                   q.set("page",       String(params.page))
  if (params.pageSize)               q.set("pageSize",   String(params.pageSize))
  const qs = q.toString()
  return `/api/matches${qs ? `?${qs}` : ""}`
}

export function useMatches(params: MatchQueryParams = {}): UseMatchesResult {
  const url = buildMatchesUrl(params)
  const { data, error, isLoading, mutate } =
    useSWR<PaginatedResponse<MatchSummary>>(url, fetcher, {
      revalidateOnFocus: false,
      refreshInterval: 60_000,
    })

  return {
    matches:    data?.data ?? [],
    total:      data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error:      error ?? null,
    mutate,
  }
}
