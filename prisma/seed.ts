/**
 * prisma/seed.ts
 * Run: npx prisma db seed
 *
 * Seeds:
 *  - 1 admin user
 *  - 6 demo users (with Player profiles)
 *  - 2 demo teams (3 players each)
 *  - 1 demo season (REGISTRATION status) with all 3 divisions
 */

import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Role, DivisionTier, BracketType, SeasonStatus, MembershipRole } from "@prisma/client"
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
    where: { email: "admin@c3esports.gg" },
    update: {},
    create: {
      email: "admin@c3esports.gg",
      name: "C3 Admin",
      password: adminPassword,
      role: Role.ADMIN,
    },
  })
  console.log(`  ✓ Admin user: ${admin.email}`)

  // ---------------------------------------------------------------------------
  // Demo players (6 users + player profiles)
  // ---------------------------------------------------------------------------
  const demoPlayers = [
    { email: "apex@demo.gg",    name: "ApexRocket",   epic: "ApexRocket",   display: "ApexRocket"   },
    { email: "blaze@demo.gg",   name: "BlazeKicker",  epic: "BlazeKicker",  display: "BlazeKicker"  },
    { email: "cipher@demo.gg",  name: "CipherBoost",  epic: "CipherBoost",  display: "CipherBoost"  },
    { email: "dusk@demo.gg",    name: "DuskDriver",   epic: "DuskDriver",   display: "DuskDriver"   },
    { email: "echo@demo.gg",    name: "EchoFlip",     epic: "EchoFlip",     display: "EchoFlip"     },
    { email: "frost@demo.gg",   name: "FrostSave",    epic: "FrostSave",    display: "FrostSave"    },
  ]

  const playerPassword = await bcrypt.hash("Player1234!", 12)
  const createdPlayers: { userId: string; playerId: string; name: string }[] = []

  for (const p of demoPlayers) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        name: p.name,
        password: playerPassword,
        role: Role.USER,
      },
    })

    const player = await prisma.player.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        displayName: p.display,
        epicUsername: p.epic,
      },
    })

    createdPlayers.push({ userId: user.id, playerId: player.id, name: p.name })
  }
  console.log(`  ✓ ${createdPlayers.length} demo players`)

  // ---------------------------------------------------------------------------
  // Demo teams (admin owns both for simplicity)
  // ---------------------------------------------------------------------------
  const teamAlpha = await prisma.team.upsert({
    where: { slug: "team-alpha" },
    update: {},
    create: {
      slug: "team-alpha",
      name: "Team Alpha",
      ownerId: admin.id,
      primaryColor: "#C0273A",
      secondaryColor: "#1A2744",
    },
  })

  const teamBeta = await prisma.team.upsert({
    where: { slug: "team-beta" },
    update: {},
    create: {
      slug: "team-beta",
      name: "Team Beta",
      ownerId: admin.id,
      primaryColor: "#1A2744",
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
    const exists = await prisma.teamMembership.findFirst({ where: { playerId: p.playerId, teamId: teamAlpha.id, leftAt: null } })
    if (!exists) {
      await prisma.teamMembership.create({
        data: { teamId: teamAlpha.id, playerId: p.playerId, role: MembershipRole.PLAYER, isCaptain: i === 0 },
      })
    }
  }

  for (const [i, p] of betaPlayers.entries()) {
    const exists = await prisma.teamMembership.findFirst({ where: { playerId: p.playerId, teamId: teamBeta.id, leftAt: null } })
    if (!exists) {
      await prisma.teamMembership.create({
        data: { teamId: teamBeta.id, playerId: p.playerId, role: MembershipRole.PLAYER, isCaptain: i === 0 },
      })
    }
  }
  console.log(`  ✓ Memberships assigned`)

  // ---------------------------------------------------------------------------
  // Demo season
  // ---------------------------------------------------------------------------
  const now = new Date()
  const regEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)  // +14 days
  const start  = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)  // +21 days
  const end    = new Date(now.getTime() + 84 * 24 * 60 * 60 * 1000)  // +12 weeks

  const season = await prisma.season.upsert({
    where: { slug: "season-1" },
    update: {},
    create: {
      slug: "season-1",
      name: "Season 1",
      description: "The inaugural C3 Esports League season. Compete across three tiers to prove your worth.",
      status: SeasonStatus.REGISTRATION,
      isVisible: true,
      registrationStart: now,
      registrationEnd: regEnd,
      startDate: start,
      endDate: end,
      leagueWeeks: 8,
    },
  })
  console.log(`  ✓ Season: ${season.name} (${season.status})`)

  // ---------------------------------------------------------------------------
  // Three fixed divisions
  // ---------------------------------------------------------------------------
  const divisionDefs = [
    { name: "Premier",          tier: DivisionTier.PREMIER,    bracketType: BracketType.DOUBLE_ELIMINATION, maxTeams: 8  },
    { name: "Open Challengers", tier: DivisionTier.CHALLENGERS, bracketType: BracketType.DOUBLE_ELIMINATION, maxTeams: 16 },
    { name: "Open Contenders",  tier: DivisionTier.CONTENDERS,  bracketType: BracketType.SWISS,              maxTeams: 32 },
  ]

  for (const def of divisionDefs) {
    await prisma.division.upsert({
      where: { seasonId_name: { seasonId: season.id, name: def.name } },
      update: {},
      create: {
        seasonId: season.id,
        name: def.name,
        tier: def.tier,
        bracketType: def.bracketType,
        maxTeams: def.maxTeams,
      },
    })
    console.log(`  ✓ Division: ${def.name} (${def.tier})`)
  }

  console.log("\n✅  Seed complete.")
  console.log("   Admin login → admin@c3esports.gg / Admin1234!")
  console.log("   Player login → apex@demo.gg / Player1234! (and others)")
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
