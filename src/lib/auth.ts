import { PrismaAdapter } from "@next-auth/prisma-adapter"
import DiscordProvider from "next-auth/providers/discord"
import CredentialsProvider from "next-auth/providers/credentials"
import type { NextAuthOptions } from "next-auth"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import type { Role } from "@prisma/client"

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
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email, deletedAt: null },
          select: { id: true, name: true, email: true, image: true, role: true, password: true },
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
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
      session.user.id = token.id
      session.user.role = token.role
      if (token.picture) session.user.image = token.picture as string
      return session
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}
