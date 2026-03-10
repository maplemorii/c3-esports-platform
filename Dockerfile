# syntax=docker/dockerfile:1
# Multi-stage build — final image contains only the standalone Next.js output.

# ─── Stage 1: install dependencies ───────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# ─── Stage 2: build ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (reads schema only — no DB connection needed)
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Stage 3: production runner ───────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Static assets
COPY --from=builder /app/public ./public

# Standalone output (includes server.js + minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema + migrations needed for `prisma migrate deploy` at startup
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Prisma CLI + all @prisma/* packages needed for `prisma migrate deploy` at startup
COPY --from=deps /app/node_modules/.bin/prisma  ./node_modules/.bin/prisma
COPY --from=deps /app/node_modules/prisma       ./node_modules/prisma
COPY --from=deps /app/node_modules/@prisma      ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# DATABASE_URL, NEXTAUTH_SECRET, DISCORD_CLIENT_*, etc. injected at runtime by Railway
# Runs migrations then starts the server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
