/**
 * useTeam.ts
 *
 * SWR hooks for team data.
 *
 * Usage:
 *   const { team, isLoading, error } = useTeam("team-id-abc")
 *   const { teams, isLoading } = useTeams({ pageSize: 20 })
 */

"use client"

import useSWR from "swr"
import type { TeamResponse, TeamSummary, PaginatedResponse, TeamQueryParams } from "@/types"

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
// useTeam — single team profile + roster
// ---------------------------------------------------------------------------

export interface UseTeamResult {
  team:      TeamResponse | null
  isLoading: boolean
  error:     Error | null
  mutate:    () => void
}

export function useTeam(teamId: string | null | undefined): UseTeamResult {
  const { data, error, isLoading, mutate } = useSWR<TeamResponse>(
    teamId ? `/api/teams/${teamId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    team:      data ?? null,
    isLoading,
    error:     error ?? null,
    mutate,
  }
}

// ---------------------------------------------------------------------------
// useTeams — paginated team list
// ---------------------------------------------------------------------------

export interface UseTeamsResult {
  teams:      TeamSummary[]
  total:      number
  totalPages: number
  isLoading:  boolean
  error:      Error | null
  mutate:     () => void
}

function buildTeamsUrl(params: TeamQueryParams): string {
  const q = new URLSearchParams()
  if (params.search)   q.set("search",   params.search)
  if (params.seasonId) q.set("seasonId", params.seasonId)
  if (params.page)     q.set("page",     String(params.page))
  if (params.pageSize) q.set("pageSize", String(params.pageSize))
  const qs = q.toString()
  return `/api/teams${qs ? `?${qs}` : ""}`
}

export function useTeams(params: TeamQueryParams = {}): UseTeamsResult {
  const url = buildTeamsUrl(params)
  const { data, error, isLoading, mutate } =
    useSWR<PaginatedResponse<TeamSummary>>(url, fetcher, { revalidateOnFocus: false })

  return {
    teams:      data?.data ?? [],
    total:      data?.total ?? 0,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error:      error ?? null,
    mutate,
  }
}
