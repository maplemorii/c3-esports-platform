-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'TEAM_MANAGER', 'STAFF', 'ADMIN');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('DRAFT', 'REGISTRATION', 'ACTIVE', 'PLAYOFFS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DivisionTier" AS ENUM ('PREMIER', 'DIVISION_1', 'DIVISION_2', 'DIVISION_3', 'OPEN');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'CHECKING_IN', 'IN_PROGRESS', 'MATCH_FINISHED', 'VERIFYING', 'COMPLETED', 'DISPUTED', 'FORFEITED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('BO1', 'BO3', 'BO5', 'BO7');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('REGULAR_SEASON', 'PLAYOFF', 'BRACKET', 'FRIENDLY');

-- CreateEnum
CREATE TYPE "GameResultSource" AS ENUM ('REPLAY_AUTO', 'MANUAL', 'STAFF_OVERRIDE');

-- CreateEnum
CREATE TYPE "ReplayParseStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'MISMATCH');

-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'SWISS', 'GSL', 'ROUND_ROBIN');

-- CreateEnum
CREATE TYPE "BracketSide" AS ENUM ('WINNERS', 'LOSERS', 'GRAND_FINALS');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('PENDING', 'CHECKED_IN', 'MISSED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('PLAYER', 'SUBSTITUTE', 'COACH');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AnnouncementVisibility" AS ENUM ('PUBLIC', 'REGISTERED', 'TEAMS_ONLY', 'STAFF_ONLY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "epicUsername" TEXT,
    "steamId" TEXT,
    "discordUsername" TEXT,
    "country" TEXT,
    "bio" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoKey" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "region" TEXT,
    "ownerId" TEXT NOT NULL,
    "website" TEXT,
    "twitterHandle" TEXT,
    "discordInvite" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_memberships" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'PLAYER',
    "isCaptain" BOOLEAN NOT NULL DEFAULT false,
    "jerseyNumber" INTEGER,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "activeDivisionId" TEXT,

    CONSTRAINT "team_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "SeasonStatus" NOT NULL DEFAULT 'DRAFT',
    "logoUrl" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "registrationStart" TIMESTAMP(3),
    "registrationEnd" TIMESTAMP(3),
    "leagueWeeks" INTEGER NOT NULL DEFAULT 8,
    "checkInWindowMinutes" INTEGER NOT NULL DEFAULT 15,
    "checkInGraceMinutes" INTEGER NOT NULL DEFAULT 5,
    "resultWindowHours" INTEGER NOT NULL DEFAULT 24,
    "pointsConfig" JSONB NOT NULL DEFAULT '{"win":3,"loss":0,"forfeitWin":3,"forfeitLoss":0}',
    "maxTeamsTotal" INTEGER,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" "DivisionTier" NOT NULL DEFAULT 'OPEN',
    "description" TEXT,
    "maxTeams" INTEGER,
    "bracketType" "BracketType" NOT NULL DEFAULT 'DOUBLE_ELIMINATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_weeks" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "label" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_registrations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "divisionId" TEXT,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "season_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "leagueWeekId" TEXT,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "format" "MatchFormat" NOT NULL DEFAULT 'BO3',
    "matchType" "MatchType" NOT NULL DEFAULT 'REGULAR_SEASON',
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "checkInOpenAt" TIMESTAMP(3),
    "checkInDeadlineAt" TIMESTAMP(3),
    "resultDeadlineAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "winnerId" TEXT,
    "gamesExpected" INTEGER,
    "replaysVerified" INTEGER NOT NULL DEFAULT 0,
    "submittedByTeamId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "confirmedByTeamId" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "enteredByStaffId" TEXT,
    "isBracketMatch" BOOLEAN NOT NULL DEFAULT false,
    "bracketSlotId" TEXT,
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_check_ins" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "status" "CheckInStatus" NOT NULL DEFAULT 'PENDING',
    "checkedInAt" TIMESTAMP(3),
    "checkedInBy" TEXT,

    CONSTRAINT "match_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_games" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "homeGoals" INTEGER NOT NULL,
    "awayGoals" INTEGER NOT NULL,
    "overtime" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "source" "GameResultSource" NOT NULL DEFAULT 'MANUAL',
    "replayUploadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_reports" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "submittingTeamId" TEXT NOT NULL,
    "reportedHomeScore" INTEGER NOT NULL,
    "reportedAwayScore" INTEGER NOT NULL,
    "gameBreakdown" JSONB NOT NULL,
    "notes" TEXT,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replay_uploads" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "fileKey" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedByTeamId" TEXT NOT NULL,
    "homeTeamColor" TEXT,
    "parseStatus" "ReplayParseStatus" NOT NULL DEFAULT 'PENDING',
    "parseStartedAt" TIMESTAMP(3),
    "parseCompletedAt" TIMESTAMP(3),
    "parseError" TEXT,
    "ballchasingId" TEXT,
    "ballchasingUrl" TEXT,
    "parsedData" JSONB,
    "parsedHomeGoals" INTEGER,
    "parsedAwayGoals" INTEGER,
    "parsedDuration" INTEGER,
    "parsedOvertime" BOOLEAN,
    "scoresAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replay_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replay_player_stats" (
    "id" TEXT NOT NULL,
    "replayUploadId" TEXT NOT NULL,
    "epicUsername" TEXT NOT NULL,
    "playerId" TEXT,
    "teamSide" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "goals" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "shots" INTEGER NOT NULL DEFAULT 0,
    "demos" INTEGER NOT NULL DEFAULT 0,
    "boostUsed" DOUBLE PRECISION,
    "avgBoostAmount" DOUBLE PRECISION,
    "timeSupersonic" DOUBLE PRECISION,
    "distanceTraveled" DOUBLE PRECISION,
    "timeInAir" DOUBLE PRECISION,
    "boostCollected" DOUBLE PRECISION,

    CONSTRAINT "replay_player_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standing_entries" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "forfeitWins" INTEGER NOT NULL DEFAULT 0,
    "forfeitLosses" INTEGER NOT NULL DEFAULT 0,
    "gamesWon" INTEGER NOT NULL DEFAULT 0,
    "gamesLost" INTEGER NOT NULL DEFAULT 0,
    "gameDifferential" INTEGER NOT NULL DEFAULT 0,
    "goalsFor" INTEGER NOT NULL DEFAULT 0,
    "goalsAgainst" INTEGER NOT NULL DEFAULT 0,
    "goalDifferential" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "winPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "standing_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brackets" (
    "id" TEXT NOT NULL,
    "divisionId" TEXT NOT NULL,
    "type" "BracketType" NOT NULL,
    "totalRounds" INTEGER,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "generatedAt" TIMESTAMP(3),
    "currentSwissRound" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brackets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bracket_slots" (
    "id" TEXT NOT NULL,
    "bracketId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "side" "BracketSide",
    "teamId" TEXT,
    "seedNumber" INTEGER,
    "isBye" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bracket_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "filedByUserId" TEXT NOT NULL,
    "filedByTeamId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceUrl" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedByUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "originalHomeScore" INTEGER,
    "originalAwayScore" INTEGER,
    "resolvedHomeScore" INTEGER,
    "resolvedAwayScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "seasonId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "AnnouncementVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "players_userId_key" ON "players"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "players_epicUsername_key" ON "players"("epicUsername");

-- CreateIndex
CREATE UNIQUE INDEX "players_steamId_key" ON "players"("steamId");

-- CreateIndex
CREATE INDEX "players_epicUsername_idx" ON "players"("epicUsername");

-- CreateIndex
CREATE INDEX "players_deletedAt_idx" ON "players"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "teams_slug_key" ON "teams"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "teams_name_key" ON "teams"("name");

-- CreateIndex
CREATE INDEX "teams_slug_idx" ON "teams"("slug");

-- CreateIndex
CREATE INDEX "teams_ownerId_idx" ON "teams"("ownerId");

-- CreateIndex
CREATE INDEX "teams_deletedAt_idx" ON "teams"("deletedAt");

-- CreateIndex
CREATE INDEX "team_memberships_teamId_idx" ON "team_memberships"("teamId");

-- CreateIndex
CREATE INDEX "team_memberships_playerId_idx" ON "team_memberships"("playerId");

-- CreateIndex
CREATE INDEX "team_memberships_activeDivisionId_idx" ON "team_memberships"("activeDivisionId");

-- CreateIndex
CREATE UNIQUE INDEX "team_memberships_playerId_activeDivisionId_key" ON "team_memberships"("playerId", "activeDivisionId");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_slug_key" ON "seasons"("slug");

-- CreateIndex
CREATE INDEX "seasons_status_idx" ON "seasons"("status");

-- CreateIndex
CREATE INDEX "seasons_slug_idx" ON "seasons"("slug");

-- CreateIndex
CREATE INDEX "divisions_seasonId_idx" ON "divisions"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "divisions_seasonId_name_key" ON "divisions"("seasonId", "name");

-- CreateIndex
CREATE INDEX "league_weeks_seasonId_idx" ON "league_weeks"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "league_weeks_seasonId_weekNumber_key" ON "league_weeks"("seasonId", "weekNumber");

-- CreateIndex
CREATE INDEX "season_registrations_seasonId_status_idx" ON "season_registrations"("seasonId", "status");

-- CreateIndex
CREATE INDEX "season_registrations_divisionId_idx" ON "season_registrations"("divisionId");

-- CreateIndex
CREATE UNIQUE INDEX "season_registrations_teamId_seasonId_key" ON "season_registrations"("teamId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "matches_bracketSlotId_key" ON "matches"("bracketSlotId");

-- CreateIndex
CREATE INDEX "matches_divisionId_status_idx" ON "matches"("divisionId", "status");

-- CreateIndex
CREATE INDEX "matches_leagueWeekId_idx" ON "matches"("leagueWeekId");

-- CreateIndex
CREATE INDEX "matches_homeTeamId_idx" ON "matches"("homeTeamId");

-- CreateIndex
CREATE INDEX "matches_awayTeamId_idx" ON "matches"("awayTeamId");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE INDEX "matches_scheduledAt_idx" ON "matches"("scheduledAt");

-- CreateIndex
CREATE INDEX "matches_deletedAt_idx" ON "matches"("deletedAt");

-- CreateIndex
CREATE INDEX "match_check_ins_matchId_idx" ON "match_check_ins"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "match_check_ins_matchId_teamId_key" ON "match_check_ins"("matchId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "match_games_replayUploadId_key" ON "match_games"("replayUploadId");

-- CreateIndex
CREATE INDEX "match_games_matchId_idx" ON "match_games"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "match_games_matchId_gameNumber_key" ON "match_games"("matchId", "gameNumber");

-- CreateIndex
CREATE INDEX "match_reports_matchId_idx" ON "match_reports"("matchId");

-- CreateIndex
CREATE INDEX "match_reports_submittingTeamId_idx" ON "match_reports"("submittingTeamId");

-- CreateIndex
CREATE UNIQUE INDEX "replay_uploads_ballchasingId_key" ON "replay_uploads"("ballchasingId");

-- CreateIndex
CREATE INDEX "replay_uploads_parseStatus_idx" ON "replay_uploads"("parseStatus");

-- CreateIndex
CREATE INDEX "replay_uploads_matchId_idx" ON "replay_uploads"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "replay_uploads_matchId_gameNumber_key" ON "replay_uploads"("matchId", "gameNumber");

-- CreateIndex
CREATE INDEX "replay_player_stats_replayUploadId_idx" ON "replay_player_stats"("replayUploadId");

-- CreateIndex
CREATE INDEX "replay_player_stats_epicUsername_idx" ON "replay_player_stats"("epicUsername");

-- CreateIndex
CREATE INDEX "replay_player_stats_playerId_idx" ON "replay_player_stats"("playerId");

-- CreateIndex
CREATE INDEX "standing_entries_divisionId_points_gameDifferential_idx" ON "standing_entries"("divisionId", "points", "gameDifferential");

-- CreateIndex
CREATE INDEX "standing_entries_teamId_idx" ON "standing_entries"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "standing_entries_divisionId_teamId_key" ON "standing_entries"("divisionId", "teamId");

-- CreateIndex
CREATE UNIQUE INDEX "brackets_divisionId_key" ON "brackets"("divisionId");

-- CreateIndex
CREATE INDEX "bracket_slots_bracketId_round_idx" ON "bracket_slots"("bracketId", "round");

-- CreateIndex
CREATE INDEX "bracket_slots_teamId_idx" ON "bracket_slots"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "bracket_slots_bracketId_round_position_side_key" ON "bracket_slots"("bracketId", "round", "position", "side");

-- CreateIndex
CREATE UNIQUE INDEX "disputes_matchId_key" ON "disputes"("matchId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "announcements_seasonId_publishedAt_idx" ON "announcements"("seasonId", "publishedAt");

-- CreateIndex
CREATE INDEX "announcements_isPinned_idx" ON "announcements"("isPinned");

-- CreateIndex
CREATE INDEX "announcements_deletedAt_idx" ON "announcements"("deletedAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_memberships" ADD CONSTRAINT "team_memberships_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_weeks" ADD CONSTRAINT "league_weeks_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_registrations" ADD CONSTRAINT "season_registrations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_registrations" ADD CONSTRAINT "season_registrations_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_registrations" ADD CONSTRAINT "season_registrations_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_leagueWeekId_fkey" FOREIGN KEY ("leagueWeekId") REFERENCES "league_weeks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_bracketSlotId_fkey" FOREIGN KEY ("bracketSlotId") REFERENCES "bracket_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_check_ins" ADD CONSTRAINT "match_check_ins_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_check_ins" ADD CONSTRAINT "match_check_ins_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_games" ADD CONSTRAINT "match_games_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_games" ADD CONSTRAINT "match_games_replayUploadId_fkey" FOREIGN KEY ("replayUploadId") REFERENCES "replay_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_reports" ADD CONSTRAINT "match_reports_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_reports" ADD CONSTRAINT "match_reports_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replay_uploads" ADD CONSTRAINT "replay_uploads_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replay_player_stats" ADD CONSTRAINT "replay_player_stats_replayUploadId_fkey" FOREIGN KEY ("replayUploadId") REFERENCES "replay_uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replay_player_stats" ADD CONSTRAINT "replay_player_stats_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standing_entries" ADD CONSTRAINT "standing_entries_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standing_entries" ADD CONSTRAINT "standing_entries_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brackets" ADD CONSTRAINT "brackets_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_bracketId_fkey" FOREIGN KEY ("bracketId") REFERENCES "brackets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bracket_slots" ADD CONSTRAINT "bracket_slots_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_filedByUserId_fkey" FOREIGN KEY ("filedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
