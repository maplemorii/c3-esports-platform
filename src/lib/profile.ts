import { prisma } from "@/lib/prisma"

export type ProfileCompleteness = {
  hasEmail: boolean
  hasPassword: boolean
  hasDiscord: boolean
  hasEpicUsername: boolean
  isComplete: boolean
}

/**
 * Returns which account requirements are met for a given userId.
 *
 * A user must satisfy all four to register for a season:
 *   1. Email address on file
 *   2. Password set (credentials sign-in)
 *   3. Discord account linked (OAuth)
 *   4. Epic Games username linked (via Player profile)
 */
export async function getProfileCompleteness(userId: string): Promise<ProfileCompleteness> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      password: true,
      accounts: { select: { provider: true } },
      player: { select: { epicUsername: true } },
    },
  })

  if (!user) {
    return { hasEmail: false, hasPassword: false, hasDiscord: false, hasEpicUsername: false, isComplete: false }
  }

  const hasEmail = !!user.email
  const hasPassword = !!user.password
  const hasDiscord = user.accounts.some((a) => a.provider === "discord")
  const hasEpicUsername = !!user.player?.epicUsername

  return {
    hasEmail,
    hasPassword,
    hasDiscord,
    hasEpicUsername,
    isComplete: hasEmail && hasPassword && hasDiscord && hasEpicUsername,
  }
}
