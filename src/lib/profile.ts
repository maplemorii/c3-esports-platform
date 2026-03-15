import { prisma } from "@/lib/prisma"

export type ProfileCompleteness = {
  hasEmail: boolean
  hasPassword: boolean
  hasDiscord: boolean
  hasTrackerUrl: boolean
  isComplete: boolean
}

/**
 * Returns which account requirements are met for a given userId.
 *
 * A user must satisfy all four to register for a season:
 *   1. Email address on file
 *   2. Password set (credentials sign-in)
 *   3. Discord account linked (OAuth)
 *   4. Rocket League Tracker Network URL linked (via Player profile)
 */
export async function getProfileCompleteness(userId: string): Promise<ProfileCompleteness> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      password: true,
      accounts: { select: { provider: true } },
      player: { select: { trackerUrl: true } },
    },
  })

  if (!user) {
    return { hasEmail: false, hasPassword: false, hasDiscord: false, hasTrackerUrl: false, isComplete: false }
  }

  const hasEmail = !!user.email
  const hasPassword = !!user.password
  const hasDiscord = user.accounts.some((a) => a.provider === "discord")
  const hasTrackerUrl = !!user.player?.trackerUrl

  return {
    hasEmail,
    hasPassword,
    hasDiscord,
    hasTrackerUrl,
    isComplete: hasEmail && hasPassword && hasDiscord && hasTrackerUrl,
  }
}
