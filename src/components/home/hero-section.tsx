"use client"

import { motion, type Variants } from "framer-motion"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const container: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
}

interface HeroSectionProps {
  isSignedIn: boolean
}

export function HeroSection({ isSignedIn }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden px-4 pt-28 pb-40 text-center">
      {/* Background texture */}
      <div className="hero-stripes absolute inset-0 opacity-60" />
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />

      {/* Animated glow orbs */}
      <motion.div
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-brand/20 blur-[140px] pointer-events-none"
        animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.28, 0.18] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 -left-40 h-[320px] w-[320px] rounded-full bg-brand/10 blur-[100px] pointer-events-none"
        animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.18, 0.1], x: [0, 24, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 h-[280px] w-[280px] rounded-full bg-sky-500/10 blur-[100px] pointer-events-none"
        animate={{ scale: [1, 1.12, 1], opacity: [0.08, 0.16, 0.08], x: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      {/* Main content */}
      <motion.div
        className="relative flex flex-col items-center gap-7 max-w-5xl mx-auto"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Live badge */}
        <motion.div variants={item}>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand">
            <motion.span
              className="h-2 w-2 rounded-full bg-brand"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            Season Registration Open
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="font-display text-6xl font-bold uppercase tracking-tight sm:text-7xl lg:text-8xl leading-none"
        >
          Carolina
          <br />
          <span className="text-brand [text-shadow:0_0_80px_oklch(0.50_0.20_15/50%)]">
            Collegiate
          </span>
          <br />
          Clash
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={item}
          className="max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed"
        >
          The premier Rocket League league for college students across North &amp; South
          Carolina. Compete in structured seasons, climb the divisions, and prove your
          team belongs at the top.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={item} className="flex flex-wrap justify-center gap-3 pt-1">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ size: "lg" }),
                "px-8 gap-2 shadow-[0_0_24px_oklch(0.50_0.20_15/30%)] hover:shadow-[0_0_44px_oklch(0.50_0.20_15/55%)] transition-all duration-300"
              )}
            >
              Go to Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <Link
              href="/auth/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "px-8 gap-2 shadow-[0_0_24px_oklch(0.50_0.20_15/30%)] hover:shadow-[0_0_44px_oklch(0.50_0.20_15/55%)] transition-all duration-300"
              )}
            >
              Register Your Team
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            href="/seasons"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8")}
          >
            View Seasons
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div variants={item} className="pt-4 flex flex-col items-center">
          <motion.div
            className="h-12 w-px bg-linear-to-b from-transparent to-muted-foreground/30"
            initial={{ scaleY: 0, originY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1, delay: 1.2, ease: EASE }}
          />
        </motion.div>
      </motion.div>

      {/* Floating card — live match (desktop only) */}
      <motion.div
        className="absolute right-6 top-1/3 hidden xl:block"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 1.0, ease: EASE }}
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-56 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="h-2 w-2 rounded-full bg-green-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Live Match
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Team Alpha</span>
                <span className="font-display text-sm font-bold text-brand">3</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Team Omega</span>
                <span className="font-display text-sm font-bold text-muted-foreground">2</span>
              </div>
            </div>
            <div className="mt-3 text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              Game 5 · Premier
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Floating card — standings (desktop only) */}
      <motion.div
        className="absolute left-6 bottom-1/4 hidden xl:block"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 1.2, ease: EASE }}
      >
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="w-52 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-4 shadow-2xl shadow-black/30">
            <div className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-3">
              Season 4 Standings
            </div>
            <div className="space-y-2">
              {[
                { name: "NC State RL", w: 8, l: 0 },
                { name: "UNC Chapel Hill", w: 7, l: 1 },
                { name: "Duke Gaming", w: 6, l: 2 },
              ].map((team, i) => (
                <div key={team.name} className="flex items-center gap-2">
                  <span className="font-display text-[10px] text-muted-foreground/40 w-3">
                    {i + 1}
                  </span>
                  <span className="text-xs font-medium flex-1 truncate">{team.name}</span>
                  <span className="font-display text-xs text-brand font-bold">
                    {team.w}-{team.l}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
