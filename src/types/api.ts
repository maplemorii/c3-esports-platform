/**
 * api.ts
 *
 * Shared API response types used by both route handlers (server) and
 * SWR hooks / fetch callers (client).
 *
 * Convention:
 *   - "Response" types mirror what the API actually returns (Prisma selects + derived fields)
 *   - "Params" / "Query" types mirror what the API accepts as input
 *   - Generic wrappers (ApiResponse, PaginatedResponse) keep envelope shapes consistent
 */

import type {
  Role,
  SeasonStatus,
  DivisionTier,
  BracketType,
  MatchStatus,
  MatchFormat,
  MatchType,
  MembershipRole,
  CheckInStatus,
  ReplayParseStatus,
  GameResultSource,
  RegistrationStatus,
  DisputeStatus,
} from "@prisma/client"

// ---------------------------------------------------------------------------
// Generic wrappers
// ---------------------------------------------------------------------------

/** Standard success envelope for single-resource responses. */
export interface ApiResponse<T> {
  data: T
}

/** Standard envelope for paginated list responses. */
export interface PaginatedResponse<T> {
  data:       T[]
  total:      number
  page:       number
  pageSize:   number
  totalPages: number
}

/** Standard error envelope (matches errors.ts shape). */
export interface ApiErrorBody {
  error:    string
  code?:    string
  details?: unknown
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface UserSummary {
  id:    string
  name:  string | null
  email: string
  image: string | null
  role:  Role
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export interface PlayerResponse {
  id:             string
  userId:         string
  displayName:    string
  avatarUrl:      string | null
  epicUsername:   string | null
  steamId:        string | null
  discordUsername:string | null
  bio:            string | null
  createdAt:      string
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export interface TeamSummary {
  id:           string
  slug:         string
  name:         string
  logoUrl:      string | null
  primaryColor: string | null
}

export interface RosterMember {
  id:          string
  role:        MembershipRole
  isCaptain:   boolean
  jerseyNumber:number | null
  joinedAt:    string
  player: {
    id:           string
    displayName:  string
    avatarUrl:    string | null
    epicUsername: string | null
  }
}

export interface TeamResponse extends TeamSummary {
  secondaryColor: string | null
  website:        string | null
  twitterHandle:  string | null
  discordInvite:  string | null
  ownerId:        string
  createdAt:      string
  memberships:    RosterMember[]
}

// ---------------------------------------------------------------------------
// Season
// ---------------------------------------------------------------------------

export interface SeasonSummary {
  id:        string
  slug:      string
  name:      string
  status:    SeasonStatus
  logoUrl:   string | null
  startDate: string | null
  endDate:   string | null
}

export interface SeasonResponse extends SeasonSummary {
  description:         string | null
  registrationStart:   string | null
  registrationEnd:     string | null
  leagueWeeks:         number
  checkInWindowMinutes:number
  checkInGraceMinutes: number
  resultWindowHours:   number
  pointsConfig:        unknown
  maxTeamsTotal:       number | null
  isVisible:           boolean
  createdAt:           string
  divisions:           DivisionSummary[]
}

// ---------------------------------------------------------------------------
// Division
// ---------------------------------------------------------------------------

export interface DivisionSummary {
  id:          string
  seasonId:    string
  name:        string
  tier:        DivisionTier
  description: string | null
  maxTeams:    number | null
  bracketType: BracketType
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export interface RegistrationResponse {
  id:           string
  teamId:       string
  seasonId:     string
  divisionId:   string | null
  status:       RegistrationStatus
  notes:        string | null
  registeredAt: string
  reviewedAt:   string | null
  team:         TeamSummary
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------

export interface MatchSummary {
  id:          string
  divisionId:  string
  homeTeamId:  string
  awayTeamId:  string
  format:      MatchFormat
  matchType:   MatchType
  status:      MatchStatus
  scheduledAt: string | null
  homeScore:   number | null
  awayScore:   number | null
  winnerId:    string | null
  homeTeam:    TeamSummary
  awayTeam:    TeamSummary
}

export interface CheckInRecord {
  teamId:      string
  status:      CheckInStatus
  checkedInAt: string | null
}

export interface MatchGameResponse {
  id:         string
  gameNumber: number
  homeGoals:  number
  awayGoals:  number
  overtime:   boolean
  duration:   number | null
  source:     GameResultSource
}

export interface ReplayResponse {
  id:              string
  matchId:         string
  gameNumber:      number
  fileKey:         string
  parseStatus:     ReplayParseStatus
  ballchasingId:   string | null
  ballchasingUrl:  string | null
  parsedHomeGoals: number | null
  parsedAwayGoals: number | null
  parsedDuration:  number | null
  scoresAccepted:  boolean
  createdAt:       string
}

export interface MatchResponse extends MatchSummary {
  leagueWeekId:       string | null
  checkInOpenAt:      string | null
  checkInDeadlineAt:  string | null
  resultDeadlineAt:   string | null
  completedAt:        string | null
  gamesExpected:      number | null
  replaysVerified:    number
  isBracketMatch:     boolean
  notes:              string | null
  checkIns:           CheckInRecord[]
  games:              MatchGameResponse[]
  replays:            ReplayResponse[]
}

// ---------------------------------------------------------------------------
// League Week
// ---------------------------------------------------------------------------

export interface LeagueWeekResponse {
  id:         string
  seasonId:   string
  weekNumber: number
  label:      string | null
  startDate:  string
  endDate:    string
  isComplete: boolean
  matchCount: number
}

// ---------------------------------------------------------------------------
// Dispute
// ---------------------------------------------------------------------------

export interface DisputeResponse {
  id:               string
  matchId:          string
  filedByUserId:    string
  filedByTeamId:    string
  reason:           string
  evidenceUrl:      string | null
  status:           DisputeStatus
  resolution:       string | null
  resolvedByUserId: string | null
  resolvedAt:       string | null
  originalHomeScore:number | null
  originalAwayScore:number | null
  resolvedHomeScore:number | null
  resolvedAwayScore:number | null
  createdAt:        string
  match:            MatchSummary
}

// ---------------------------------------------------------------------------
// Presigned upload
// ---------------------------------------------------------------------------

export interface PresignedUploadResponse {
  uploadUrl: string
  fileKey:   string
  publicUrl: string
}

// ---------------------------------------------------------------------------
// Query param shapes (used by hooks + API routes)
// ---------------------------------------------------------------------------

export interface MatchQueryParams {
  divisionId?: string
  weekId?:     string
  status?:     MatchStatus
  teamId?:     string
  upcoming?:   boolean
  page?:       number
  pageSize?:   number
}

export interface TeamQueryParams {
  search?:   string
  seasonId?: string
  page?:     number
  pageSize?: number
}

export interface PlayerQueryParams {
  search?:  string
  page?:    number
  pageSize?:number
}
