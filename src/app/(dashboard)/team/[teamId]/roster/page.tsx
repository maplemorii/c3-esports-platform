"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Link2,
  Link2Off,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import type { MembershipRole } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
  id:              string
  displayName:     string
  avatarUrl:       string | null
  epicUsername:    string | null
  discordUsername: string | null
  user?:           { image: string | null } | null
}

interface Member {
  id:        string
  role:      MembershipRole
  isCaptain: boolean
  joinedAt:  string
  player:    Player | null
}

interface TeamInfo {
  id:      string
  name:    string
  ownerId: string
}

interface InviteInfo {
  inviteToken:     string | null
  inviteExpiresAt: string | null
}

const ROLE_OPTIONS: { value: MembershipRole; label: string }[] = [
  { value: "PLAYER",     label: "Player"     },
  { value: "SUBSTITUTE", label: "Substitute" },
  { value: "COACH",      label: "Coach"      },
]

const ROLE_BADGE: Record<MembershipRole, string> = {
  PLAYER:     "bg-muted text-muted-foreground",
  SUBSTITUTE: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  COACH:      "bg-blue-500/15 text-blue-400 border-blue-500/30",
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none " +
  "placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RosterPage() {
  const params   = useParams<{ teamId: string }>()
  const teamId   = params.teamId
  const router   = useRouter()

  const [team,          setTeam]          = useState<TeamInfo | null>(null)
  const [roster,        setRoster]        = useState<Member[]>([])
  const [rosterLocked,  setRosterLocked]  = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  // Add-player panel state
  const [showAdd,      setShowAdd]      = useState(false)
  const [playerSearch, setPlayerSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Player[]>([])
  const [searching,    setSearching]    = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [addRole,    setAddRole]    = useState<MembershipRole>("PLAYER")
  const [addCaptain, setAddCaptain] = useState(false)
  const [addError,   setAddError]   = useState<string | null>(null)
  const [adding,       setAdding]       = useState(false)

  // Remove state
  const [removingId, setRemovingId] = useState<string | null>(null)

  // Invite state
  const [invite,          setInvite]          = useState<InviteInfo | null>(null)
  const [inviteLoading,   setInviteLoading]   = useState(false)
  const [inviteGenerating, setInviteGenerating] = useState(false)
  const [inviteRevoking,  setInviteRevoking]  = useState(false)
  const [copied,          setCopied]          = useState(false)

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchRoster = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [teamRes, rosterRes] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch(`/api/teams/${teamId}/roster`),
      ])
      if (!teamRes.ok)   { setError("Team not found"); return }
      if (!rosterRes.ok) { setError("Failed to load roster"); return }

      const teamData   = await teamRes.json()
      const rosterData = await rosterRes.json()
      setTeam({ id: teamData.id, name: teamData.name, ownerId: teamData.ownerId })
      setRoster(rosterData.data)
      setRosterLocked(rosterData.rosterLocked ?? false)
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [teamId])

  const fetchInvite = useCallback(async () => {
    setInviteLoading(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/invite`)
      if (res.ok) {
        setInvite(await res.json())
      }
    } finally {
      setInviteLoading(false)
    }
  }, [teamId])

  useEffect(() => { fetchRoster() }, [fetchRoster])
  useEffect(() => { fetchInvite() }, [fetchInvite])

  // ---------------------------------------------------------------------------
  // Player search (debounced)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!playerSearch.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res  = await fetch(`/api/players?search=${encodeURIComponent(playerSearch)}&pageSize=8`)
        const data = await res.json()
        setSearchResults(data.data ?? [])
      } finally {
        setSearching(false)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [playerSearch])

  // ---------------------------------------------------------------------------
  // Add player
  // ---------------------------------------------------------------------------

  async function handleAdd() {
    if (!selectedPlayer) return
    setAddError(null)
    setAdding(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/roster`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId:  selectedPlayer.id,
          role:      addRole,
          isCaptain: addCaptain,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setAddError(data.error ?? "Failed to add player"); return }

      // Reset panel and refresh
      setShowAdd(false)
      setSelectedPlayer(null)
      setPlayerSearch("")
      setSearchResults([])
      setAddRole("PLAYER")
      setAddCaptain(false)
      fetchRoster()
    } finally {
      setAdding(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Remove player
  // ---------------------------------------------------------------------------

  async function handleRemove(entryId: string) {
    setRemovingId(entryId)
    try {
      await fetch(`/api/teams/${teamId}/roster/${entryId}`, { method: "DELETE" })
      setRoster((prev) => prev.filter((m) => m.id !== entryId))
    } finally {
      setRemovingId(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Invite link actions
  // ---------------------------------------------------------------------------

  async function handleGenerateInvite() {
    setInviteGenerating(true)
    try {
      const res = await fetch(`/api/teams/${teamId}/invite`, { method: "POST" })
      if (res.ok) setInvite(await res.json())
    } finally {
      setInviteGenerating(false)
    }
  }

  async function handleRevokeInvite() {
    setInviteRevoking(true)
    try {
      await fetch(`/api/teams/${teamId}/invite`, { method: "DELETE" })
      setInvite({ inviteToken: null, inviteExpiresAt: null })
    } finally {
      setInviteRevoking(false)
    }
  }

  function handleCopy() {
    if (!invite?.inviteToken) return
    const url = `${window.location.origin}/invite/${invite.inviteToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
        <p>{error ?? "Team not found"}</p>
        <button onClick={() => router.back()} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Go Back
        </button>
      </div>
    )
  }

  const inviteUrl = invite?.inviteToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${invite.inviteToken}`
    : null

  const inviteExpiry = invite?.inviteExpiresAt
    ? new Date(invite.inviteExpiresAt).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      })
    : null

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/team" className="hover:text-brand transition-colors">My Teams</Link>
        <span className="opacity-40">/</span>
        <Link href={`/team/${teamId}`} className="hover:text-brand transition-colors truncate max-w-40">{team.name}</Link>
        <span className="opacity-40">/</span>
        <span className="text-foreground">Roster</span>
      </div>

      {/* Roster locked banner */}
      {rosterLocked && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-300 font-medium">
            Roster is locked for the current season — changes are disabled.
          </p>
        </div>
      )}

      {/* Header card */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.7), rgba(59,130,246,0.4), transparent)" }}
          aria-hidden
        />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: "rgba(196,28,53,0.8)" }}>
              {team.name}
            </p>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide">Roster</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {roster.length} active member{roster.length !== 1 ? "s" : ""}
              <span className="opacity-50"> · max 8</span>
            </p>
          </div>
          {!showAdd && roster.length < 8 && !rosterLocked && (
            <button
              onClick={() => setShowAdd(true)}
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shrink-0")}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Player
            </button>
          )}
        </div>
      </div>

      {/* Add-player panel */}
      {showAdd && (
        <div className="rounded-xl border border-brand/30 bg-card p-5 space-y-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Add Player
          </h2>

          {/* Player search */}
          {!selectedPlayer ? (
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Search by display name or Epic username
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search players…"
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className={cn(inputCls, "pl-8")}
                  autoFocus
                />
              </div>

              {searching && (
                <p className="text-xs text-muted-foreground px-1">Searching…</p>
              )}

              {searchResults.length > 0 && (
                <ul className="rounded-md border border-border bg-background divide-y divide-border max-h-48 overflow-y-auto">
                  {searchResults.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedPlayer(p); setPlayerSearch("") }}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                          <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{p.displayName}</p>
                          {p.epicUsername && (
                            <p className="text-xs text-muted-foreground truncate">{p.epicUsername}</p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {playerSearch && !searching && searchResults.length === 0 && (
                <p className="text-xs text-muted-foreground px-1">No players found.</p>
              )}
            </div>
          ) : (
            /* Selected player + role config */
            <div className="space-y-4">
              {/* Selected player chip */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
                <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{selectedPlayer.displayName}</p>
                  {selectedPlayer.epicUsername && (
                    <p className="text-xs text-muted-foreground">{selectedPlayer.epicUsername}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  Change
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as MembershipRole)}
                  className={cn(inputCls, "cursor-pointer")}
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Captain toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={addCaptain}
                  onChange={(e) => setAddCaptain(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-brand"
                />
                <span className="text-sm text-muted-foreground">
                  Set as team captain
                  <Crown className="inline h-3 w-3 text-yellow-500 ml-1" />
                </span>
              </label>

              {addError && (
                <p className="text-xs text-destructive">{addError}</p>
              )}
            </div>
          )}

          {/* Panel actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-border">
            <button
              type="button"
              onClick={() => { setShowAdd(false); setSelectedPlayer(null); setPlayerSearch(""); setAddError(null) }}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Cancel
            </button>
            {selectedPlayer && (
              <button
                type="button"
                onClick={handleAdd}
                disabled={adding}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                {adding && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {adding ? "Adding…" : "Add to Roster"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Invite Link panel */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Invite Link
            </h2>
            {inviteUrl && inviteExpiry && (
              <p className="text-xs text-muted-foreground mt-0.5">Expires {inviteExpiry}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {inviteUrl ? (
              <>
                <button
                  onClick={handleGenerateInvite}
                  disabled={inviteGenerating}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                  title="Generate new link"
                >
                  {inviteGenerating
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />
                  }
                  New Link
                </button>
                <button
                  onClick={handleRevokeInvite}
                  disabled={inviteRevoking}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-destructive hover:text-destructive")}
                  title="Revoke invite link"
                >
                  {inviteRevoking
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Link2Off className="h-3.5 w-3.5" />
                  }
                  Revoke
                </button>
              </>
            ) : (
              <button
                onClick={handleGenerateInvite}
                disabled={inviteGenerating || inviteLoading}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                {inviteGenerating
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Link2 className="h-3.5 w-3.5" />
                }
                Generate Link
              </button>
            )}
          </div>
        </div>

        {inviteLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading…
          </div>
        ) : inviteUrl ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <span className="flex-1 min-w-0 text-xs text-muted-foreground font-mono truncate">
              {inviteUrl}
            </span>
            <button
              onClick={handleCopy}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "shrink-0",
                copied ? "text-green-500" : "text-muted-foreground hover:text-foreground"
              )}
              title="Copy link"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            No active invite link. Generate one to let players join directly.
          </p>
        )}
      </div>

      {/* Roster list */}
      <div className="rounded-xl border border-border bg-card">
        {roster.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <UserRound className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No players on the roster yet.</p>
            <button
              onClick={() => setShowAdd(true)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1 gap-1.5")}
            >
              <Plus className="h-3.5 w-3.5" />
              Add First Player
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {roster.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-5 py-3">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                  {(m.player?.avatarUrl ?? m.player?.user?.image) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(m.player!.avatarUrl ?? m.player!.user?.image)!} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">
                      {m.player?.displayName ?? "Unknown"}
                    </span>
                    {m.isCaptain && (
                      <Crown className="h-3 w-3 text-yellow-500 shrink-0" aria-label="Captain" />
                    )}
                  </div>
                  {m.player?.epicUsername && (
                    <p className="text-xs text-muted-foreground truncate">{m.player.epicUsername}</p>
                  )}
                </div>

                {/* Role badge */}
                <span className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0",
                  ROLE_BADGE[m.role]
                )}>
                  {m.role === "SUBSTITUTE" ? "Sub" : m.role.charAt(0) + m.role.slice(1).toLowerCase()}
                </span>

                {/* Remove — hidden when roster is locked */}
                {!rosterLocked && (
                  <button
                    onClick={() => handleRemove(m.id)}
                    disabled={removingId === m.id}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "icon-sm" }),
                      "shrink-0 text-muted-foreground hover:text-destructive"
                    )}
                    aria-label="Remove player"
                  >
                    {removingId === m.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Trash2 className="h-3.5 w-3.5" />
                    }
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  )
}
