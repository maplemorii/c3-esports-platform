import { PrismaAdapter } from "@next-auth/prisma-adapter"
import DiscordProvider from "next-auth/providers/discord"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { verifySync } from "otplib"
import { prisma } from "@/lib/prisma"
import { sendEmailVerificationEmail } from "@/lib/email"
import type { Role } from "@prisma/client"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a random token, store its SHA-256 hash in DB, return raw token. */
async function issueEmailVerifyToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(32).toString("hex")
  const hash = crypto.createHash("sha256").update(raw).digest("hex")
  await prisma.user.update({
    where: { id: userId },
    data: {
      emailVerifyToken:   hash,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })
  return raw
}

/** Send verification email if user isn't verified and has no pending token. */
async function maybeSendVerification(userId: string, email: string, name?: string | null) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true, emailVerifyToken: true },
  })
  if (!user || user.emailVerified) return
  // Only send if there's no unexpired pending token
  if (user.emailVerifyToken) return
  const raw = await issueEmailVerifyToken(userId)
  await sendEmailVerificationEmail(email, name, raw)
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  // JWT strategy so the role is available in middleware without a DB round-trip
  session: { strategy: "jwt" },

  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email",   type: "email"    },
        password: { label: "Password", type: "password" },
        totp:  { label: "2FA Code", type: "text"    }, // optional; required when 2FA is enabled
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email, deletedAt: null },
          select: {
            id: true, name: true, email: true, image: true, role: true,
            password: true, twoFactorEnabled: true, twoFactorSecret: true,
          },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        // ── 2FA check ────────────────────────────────────────────────────────
        if (user.twoFactorEnabled && user.twoFactorSecret) {
          if (!credentials.totp) {
            // Signal to the sign-in form that TOTP is required
            throw new Error("2FA_REQUIRED")
          }
          const result    = verifySync({ token: credentials.totp.replace(/\s/g, ""), secret: user.twoFactorSecret })
          const totpValid = result.valid
          if (!totpValid) throw new Error("2FA_INVALID")
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role }
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      // Fire-and-forget: send verification email on first sign-in for any provider
      if (user.id && user.email) {
        maybeSendVerification(user.id, user.email, user.name).catch(() => {/* non-blocking */})
      }
      return true
    },

    async jwt({ token, user, trigger }) {
      if (user) {
        token.id   = user.id
        token.role = (user as { role: Role }).role
        if (user.image) token.picture = user.image
      }
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { image: true, role: true },
        })
        if (dbUser) {
          token.picture = dbUser.image
          token.role    = dbUser.role
        }
      }
      // Inject DEVELOPER role for the designated account (not stored in DB)
      if (process.env.DEVELOPER_USER_ID && token.id === process.env.DEVELOPER_USER_ID) {
        token.role = "DEVELOPER" as Role
      }
      return token
    },

    async session({ session, token }) {
      session.user.id    = token.id
      session.user.role  = token.role
      if (token.picture) session.user.image = token.picture as string
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    error:  "/auth/error",
  },
}
