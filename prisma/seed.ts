/**
 * prisma/seed.ts
 * Run: npx prisma db seed
 *
 * Seeds:
 *  - 1 admin user
 *  - 6 demo users (with Player profiles)
 *  - 2 demo teams (3 players each)
 *  - 1 ACTIVE season with all 3 divisions
 *  - Both teams APPROVED in Open Challengers
 *  - 3 league weeks
 *  - 4 matches in different states (COMPLETED, IN_PROGRESS, CHECKING_IN, SCHEDULED)
 *  - Standing entries reflecting the completed match result
 */

import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import {
  PrismaClient,
  Role,
  DivisionTier,
  BracketType,
  SeasonStatus,
  MembershipRole,
  MatchStatus,
  MatchFormat,
  MatchType,
  RegistrationStatus,
  CheckInStatus,
  GameResultSource,
} from "@prisma/client"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱  Seeding database…")

  // ---------------------------------------------------------------------------
  // Admin user
  // ---------------------------------------------------------------------------
  const adminPassword = await bcrypt.hash("Admin1234!", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@c3esports.com" },
    update: {},
    create: {
      email:    "admin@c3esports.com",
      name:     "C3 Admin",
      password: adminPassword,
      role:     Role.ADMIN,
    },
  })
  console.log(`  ✓ Admin user: ${admin.email}`)

  // ---------------------------------------------------------------------------
  // Demo players (6 users + player profiles)
  // ---------------------------------------------------------------------------
  const demoPlayers = [
    { email: "apex@demo.gg",   name: "ApexRocket",  epic: "ApexRocket",  display: "ApexRocket"  },
    { email: "blaze@demo.gg",  name: "BlazeKicker", epic: "BlazeKicker", display: "BlazeKicker" },
    { email: "cipher@demo.gg", name: "CipherBoost", epic: "CipherBoost", display: "CipherBoost" },
    { email: "dusk@demo.gg",   name: "DuskDriver",  epic: "DuskDriver",  display: "DuskDriver"  },
    { email: "echo@demo.gg",   name: "EchoFlip",    epic: "EchoFlip",    display: "EchoFlip"    },
    { email: "frost@demo.gg",  name: "FrostSave",   epic: "FrostSave",   display: "FrostSave"   },
  ]

  const playerPassword = await bcrypt.hash("Player1234!", 12)
  const createdPlayers: { userId: string; playerId: string; name: string }[] = []

  for (const p of demoPlayers) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email:    p.email,
        name:     p.name,
        password: playerPassword,
        role:     Role.USER,
      },
    })
    const player = await prisma.player.upsert({
      where:  { userId: user.id },
      update: {},
      create: { userId: user.id, displayName: p.display, epicUsername: p.epic },
    })
    createdPlayers.push({ userId: user.id, playerId: player.id, name: p.name })
  }
  console.log(`  ✓ ${createdPlayers.length} demo players`)

  // ---------------------------------------------------------------------------
  // Demo teams (admin owns both for simplicity)
  // ---------------------------------------------------------------------------
  const teamAlpha = await prisma.team.upsert({
    where:  { slug: "team-alpha" },
    update: {},
    create: {
      slug:           "team-alpha",
      name:           "Team Alpha",
      ownerId:        admin.id,
      primaryColor:   "#C0273A",
      secondaryColor: "#1A2744",
    },
  })

  const teamBeta = await prisma.team.upsert({
    where:  { slug: "team-beta" },
    update: {},
    create: {
      slug:           "team-beta",
      name:           "Team Beta",
      ownerId:        admin.id,
      primaryColor:   "#1A2744",
      secondaryColor: "#C0273A",
    },
  })
  console.log(`  ✓ Teams: ${teamAlpha.name}, ${teamBeta.name}`)

  // ---------------------------------------------------------------------------
  // Team memberships (3 players per team; first player = captain)
  // ---------------------------------------------------------------------------
  const alphaPlayers = createdPlayers.slice(0, 3)
  const betaPlayers  = createdPlayers.slice(3, 6)

  for (const [i, p] of alphaPlayers.entries()) {
    const exists = await prisma.teamMembership.findFirst({
      where: { playerId: p.playerId, teamId: teamAlpha.id, leftAt: null },
    })
    if (!exists) {
      await prisma.teamMembership.create({
        data: { teamId: teamAlpha.id, playerId: p.playerId, role: MembershipRole.PLAYER, isCaptain: i === 0 },
      })
    }
  }
  for (const [i, p] of betaPlayers.entries()) {
    const exists = await prisma.teamMembership.findFirst({
      where: { playerId: p.playerId, teamId: teamBeta.id, leftAt: null },
    })
    if (!exists) {
      await prisma.teamMembership.create({
        data: { teamId: teamBeta.id, playerId: p.playerId, role: MembershipRole.PLAYER, isCaptain: i === 0 },
      })
    }
  }
  console.log(`  ✓ Memberships assigned`)

  // ---------------------------------------------------------------------------
  // Demo season (ACTIVE so standings + matches are live)
  // ---------------------------------------------------------------------------
  const now       = new Date()
  const weekAgo   = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)
  const sixWeeks  = new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000)

  const season = await prisma.season.upsert({
    where:  { slug: "season-1" },
    update: { status: SeasonStatus.ACTIVE },     // ensure ACTIVE on re-run
    create: {
      slug:              "season-1",
      name:              "Season 1",
      description:       "The inaugural C3 Esports League season. Compete across three tiers to prove your worth.",
      status:            SeasonStatus.ACTIVE,
      isVisible:         true,
      registrationStart: weekAgo,
      registrationEnd:   weekAgo,
      startDate:         weekAgo,
      endDate:           sixWeeks,
      leagueWeeks:       8,
    },
  })
  console.log(`  ✓ Season: ${season.name} (${season.status})`)

  // ---------------------------------------------------------------------------
  // Three divisions
  // ---------------------------------------------------------------------------
  const divisionDefs = [
    { name: "Premier",          tier: DivisionTier.PREMIER,    bracketType: BracketType.DOUBLE_ELIMINATION, maxTeams: 8  },
    { name: "Open Challengers", tier: DivisionTier.CHALLENGERS, bracketType: BracketType.DOUBLE_ELIMINATION, maxTeams: 16 },
    { name: "Open Contenders",  tier: DivisionTier.CONTENDERS,  bracketType: BracketType.SWISS,              maxTeams: 32 },
  ]

  const divisions: Record<string, { id: string }> = {}
  for (const def of divisionDefs) {
    const div = await prisma.division.upsert({
      where:  { seasonId_name: { seasonId: season.id, name: def.name } },
      update: {},
      create: {
        seasonId:    season.id,
        name:        def.name,
        tier:        def.tier,
        bracketType: def.bracketType,
        maxTeams:    def.maxTeams,
      },
    })
    divisions[def.name] = { id: div.id }
    console.log(`  ✓ Division: ${def.name}`)
  }

  const challDivId = divisions["Open Challengers"].id

  // ---------------------------------------------------------------------------
  // Register both teams in Open Challengers (APPROVED)
  // ---------------------------------------------------------------------------
  await prisma.seasonRegistration.upsert({
    where:  { teamId_seasonId: { teamId: teamAlpha.id, seasonId: season.id } },
    update: { status: RegistrationStatus.APPROVED, divisionId: challDivId },
    create: { teamId: teamAlpha.id, seasonId: season.id, divisionId: challDivId, status: RegistrationStatus.APPROVED },
  })
  await prisma.seasonRegistration.upsert({
    where:  { teamId_seasonId: { teamId: teamBeta.id, seasonId: season.id } },
    update: { status: RegistrationStatus.APPROVED, divisionId: challDivId },
    create: { teamId: teamBeta.id, seasonId: season.id, divisionId: challDivId, status: RegistrationStatus.APPROVED },
  })
  console.log(`  ✓ Both teams registered in Open Challengers`)

  // ---------------------------------------------------------------------------
  // League weeks (3 weeks: past, current, upcoming)
  // ---------------------------------------------------------------------------
  const week1Start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const week1End   = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000)
  const week2Start = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000)
  const week2End   = new Date(now.getTime() +  0 * 24 * 60 * 60 * 1000)
  const week3Start = new Date(now.getTime() +  0 * 24 * 60 * 60 * 1000)
  const week3End   = new Date(now.getTime() +  7 * 24 * 60 * 60 * 1000)

  const week1 = await prisma.leagueWeek.upsert({
    where:  { seasonId_weekNumber: { seasonId: season.id, weekNumber: 1 } },
    update: { isComplete: true },
    create: { seasonId: season.id, weekNumber: 1, startDate: week1Start, endDate: week1End, isComplete: true },
  })
  const week2 = await prisma.leagueWeek.upsert({
    where:  { seasonId_weekNumber: { seasonId: season.id, weekNumber: 2 } },
    update: {},
    create: { seasonId: season.id, weekNumber: 2, startDate: week2Start, endDate: week2End },
  })
  const week3 = await prisma.leagueWeek.upsert({
    where:  { seasonId_weekNumber: { seasonId: season.id, weekNumber: 3 } },
    update: {},
    create: { seasonId: season.id, weekNumber: 3, startDate: week3Start, endDate: week3End },
  })
  console.log(`  ✓ League weeks 1–3`)

  // ---------------------------------------------------------------------------
  // Matches
  // ---------------------------------------------------------------------------

  // Helper: find-or-create a match (seed is not truly idempotent for matches
  // since there's no natural unique key; skip creation if one already exists
  // for the same week + teams).
  async function findOrCreateMatch(data: Parameters<typeof prisma.match.create>[0]["data"]) {
    const existing = await prisma.match.findFirst({
      where: {
        leagueWeekId: data.leagueWeekId as string ?? undefined,
        homeTeamId:   data.homeTeamId as string,
        awayTeamId:   data.awayTeamId as string,
        deletedAt:    null,
      },
    })
    if (existing) return existing
    return prisma.match.create({ data })
  }

  // ── Match 1: COMPLETED  (Week 1, Alpha won 2–1 in BO3) ──────────────────
  const completedAt = new Date(week1End.getTime() - 2 * 60 * 60 * 1000) // 2h before week1 ended

  const match1 = await findOrCreateMatch({
    divisionId:       challDivId,
    leagueWeekId:     week1.id,
    homeTeamId:       teamAlpha.id,
    awayTeamId:       teamBeta.id,
    format:           MatchFormat.BO3,
    matchType:        MatchType.REGULAR_SEASON,
    status:           MatchStatus.COMPLETED,
    scheduledAt:      new Date(week1Start.getTime() + 3 * 24 * 60 * 60 * 1000),
    gamesExpected:    3,
    homeScore:        2,
    awayScore:        1,
    winnerId:         teamAlpha.id,
    completedAt,
    submittedByTeamId: teamAlpha.id,
    confirmedByTeamId: teamBeta.id,
  })

  // Game results for match 1
  for (const game of [
    { gameNumber: 1, homeGoals: 3, awayGoals: 2, overtime: false }, // Alpha wins
    { gameNumber: 2, homeGoals: 1, awayGoals: 4, overtime: false }, // Beta wins
    { gameNumber: 3, homeGoals: 2, awayGoals: 1, overtime: true  }, // Alpha wins (OT)
  ]) {
    const existing = await prisma.matchGame.findFirst({
      where: { matchId: match1.id, gameNumber: game.gameNumber },
    })
    if (!existing) {
      await prisma.matchGame.create({
        data: {
          matchId:    match1.id,
          gameNumber: game.gameNumber,
          homeGoals:  game.homeGoals,
          awayGoals:  game.awayGoals,
          overtime:   game.overtime,
          source:     GameResultSource.MANUAL,
        },
      })
    }
  }
  console.log(`  ✓ Match 1: COMPLETED — Alpha 2–1 Beta (Week 1)`)

  // ── Match 2: IN_PROGRESS  (Week 2, Alpha vs Beta) ───────────────────────
  await findOrCreateMatch({
    divisionId:    challDivId,
    leagueWeekId:  week2.id,
    homeTeamId:    teamAlpha.id,
    awayTeamId:    teamBeta.id,
    format:        MatchFormat.BO5,
    matchType:     MatchType.REGULAR_SEASON,
    status:        MatchStatus.IN_PROGRESS,
    scheduledAt:   new Date(now.getTime() - 90 * 60 * 1000), // started 90 min ago
    gamesExpected: 5,
  })
  console.log(`  ✓ Match 2: IN_PROGRESS — Alpha vs Beta BO5 (Week 2)`)

  // ── Match 3: CHECKING_IN  (Week 3, Beta vs Alpha) ───────────────────────
  const checkInOpen     = new Date(now.getTime() - 20 * 60 * 1000) // opened 20 min ago
  const checkInDeadline = new Date(now.getTime() + 10 * 60 * 1000) // deadline in 10 min

  const match3 = await findOrCreateMatch({
    divisionId:       challDivId,
    leagueWeekId:     week3.id,
    homeTeamId:       teamBeta.id,
    awayTeamId:       teamAlpha.id,
    format:           MatchFormat.BO3,
    matchType:        MatchType.REGULAR_SEASON,
    status:           MatchStatus.CHECKING_IN,
    scheduledAt:      new Date(now.getTime() + 5 * 60 * 1000), // 5 min from now
    checkInOpenAt:    checkInOpen,
    checkInDeadlineAt: checkInDeadline,
    gamesExpected:    3,
  })

  // Beta has checked in; Alpha has not
  const existingBetaCheckIn = await prisma.matchCheckIn.findFirst({
    where: { matchId: match3.id, teamId: teamBeta.id },
  })
  if (!existingBetaCheckIn) {
    await prisma.matchCheckIn.create({
      data: {
        matchId:     match3.id,
        teamId:      teamBeta.id,
        status:      CheckInStatus.CHECKED_IN,
        checkedInAt: new Date(now.getTime() - 10 * 60 * 1000),
        checkedInBy: admin.id,
      },
    })
  }
  const existingAlphaCheckIn = await prisma.matchCheckIn.findFirst({
    where: { matchId: match3.id, teamId: teamAlpha.id },
  })
  if (!existingAlphaCheckIn) {
    await prisma.matchCheckIn.create({
      data: {
        matchId: match3.id,
        teamId:  teamAlpha.id,
        status:  CheckInStatus.PENDING,
      },
    })
  }
  console.log(`  ✓ Match 3: CHECKING_IN — Beta vs Alpha (Beta checked in, Alpha pending) (Week 3)`)

  // ── Match 4: SCHEDULED  (Week 3, Alpha vs Beta) ─────────────────────────
  await findOrCreateMatch({
    divisionId:  challDivId,
    leagueWeekId: week3.id,
    homeTeamId:  teamAlpha.id,
    awayTeamId:  teamBeta.id,
    format:      MatchFormat.BO3,
    matchType:   MatchType.REGULAR_SEASON,
    status:      MatchStatus.SCHEDULED,
    scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
  })
  console.log(`  ✓ Match 4: SCHEDULED — Alpha vs Beta (Week 3, in 3 days)`)

  // ---------------------------------------------------------------------------
  // Standing entries (reflect the 1 completed match)
  // Alpha: 1W 0L, 2 gamesWon 1 gameLost, +1 GD, 3 pts, streak +1
  // Beta:  0W 1L, 1 gamesWon 2 gamesLost, -1 GD, 0 pts, streak -1
  // ---------------------------------------------------------------------------
  await prisma.standingEntry.upsert({
    where:  { divisionId_teamId: { divisionId: challDivId, teamId: teamAlpha.id } },
    update: {
      wins: 1, losses: 0, matchesPlayed: 1,
      gamesWon: 2, gamesLost: 1, gameDifferential: 1,
      goalsFor: 6, goalsAgainst: 7, goalDifferential: -1,
      points: 3, streak: 1, winPct: 1.0,
    },
    create: {
      divisionId: challDivId, teamId: teamAlpha.id,
      wins: 1, losses: 0, matchesPlayed: 1,
      gamesWon: 2, gamesLost: 1, gameDifferential: 1,
      goalsFor: 6, goalsAgainst: 7, goalDifferential: -1,
      points: 3, streak: 1, winPct: 1.0,
    },
  })
  await prisma.standingEntry.upsert({
    where:  { divisionId_teamId: { divisionId: challDivId, teamId: teamBeta.id } },
    update: {
      wins: 0, losses: 1, matchesPlayed: 1,
      gamesWon: 1, gamesLost: 2, gameDifferential: -1,
      goalsFor: 7, goalsAgainst: 6, goalDifferential: 1,
      points: 0, streak: -1, winPct: 0.0,
    },
    create: {
      divisionId: challDivId, teamId: teamBeta.id,
      wins: 0, losses: 1, matchesPlayed: 1,
      gamesWon: 1, gamesLost: 2, gameDifferential: -1,
      goalsFor: 7, goalsAgainst: 6, goalDifferential: 1,
      points: 0, streak: -1, winPct: 0.0,
    },
  })
  console.log(`  ✓ Standing entries: Alpha 3pts #1 · Beta 0pts #2`)

  // ---------------------------------------------------------------------------
  // Head-to-head records (from the 1 completed match: Alpha 2–1 Beta)
  // ---------------------------------------------------------------------------
  await prisma.headToHeadRecord.upsert({
    where:  { divisionId_teamId_opponentId: { divisionId: challDivId, teamId: teamAlpha.id, opponentId: teamBeta.id } },
    update: { wins: 1, losses: 0, gamesWon: 2, gamesLost: 1, points: 3 },
    create: { divisionId: challDivId, teamId: teamAlpha.id, opponentId: teamBeta.id, wins: 1, losses: 0, gamesWon: 2, gamesLost: 1, points: 3 },
  })
  await prisma.headToHeadRecord.upsert({
    where:  { divisionId_teamId_opponentId: { divisionId: challDivId, teamId: teamBeta.id, opponentId: teamAlpha.id } },
    update: { wins: 0, losses: 1, gamesWon: 1, gamesLost: 2, points: 0 },
    create: { divisionId: challDivId, teamId: teamBeta.id, opponentId: teamAlpha.id, wins: 0, losses: 1, gamesWon: 1, gamesLost: 2, points: 0 },
  })
  console.log(`  ✓ H2H records: Alpha 1-0 vs Beta · Beta 0-1 vs Alpha`)

  // ---------------------------------------------------------------------------
  // Done
  // ---------------------------------------------------------------------------
  console.log("\n✅  Seed complete.")
  console.log("   Admin login  → admin@c3esports.com / Admin1234!")
  console.log("   Player login → apex@demo.gg / Player1234! (and blaze, cipher, dusk, echo, frost)")
  console.log("")
  console.log("   Season 1 — ACTIVE · Open Challengers division")
  console.log("   Match 1 → COMPLETED   Alpha 2–1 Beta (Week 1)")
  console.log("   Match 2 → IN_PROGRESS Alpha vs Beta BO5 (Week 2)")
  console.log("   Match 3 → CHECKING_IN Beta vs Alpha (Week 3, Beta checked in)")
  console.log("   Match 4 → SCHEDULED   Alpha vs Beta in 3 days (Week 3)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
