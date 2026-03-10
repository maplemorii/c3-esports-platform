"use client"

import { useRef } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { FileVideo, Users, BarChart3, Shield, Zap, Calendar } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: FileVideo,
    title: "Replay Parsing",
    description:
      "Upload your .replay files and scores are extracted automatically via ballchasing.com — no manual entry needed.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Build your roster, manage substitutes, and register for seasons — all from a unified team dashboard.",
  },
  {
    icon: BarChart3,
    title: "Live Standings",
    description:
      "Standings and game differentials update the moment a match is confirmed. Playoff brackets generate automatically.",
  },
  {
    icon: Calendar,
    title: "Scheduled Matches",
    description:
      "Weekly match windows with built-in check-in, grace periods, and automatic forfeit handling.",
  },
  {
    icon: Shield,
    title: "Dispute System",
    description:
      "Score conflicts? File a dispute with evidence. Staff review and resolve with a full audit trail.",
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    description:
      "Get alerted when check-in opens, scores are submitted, or staff take action on your team.",
  },
]

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlightBg = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(280px circle at ${x}px ${y}px, oklch(0.50 0.20 15 / 0.08), transparent 70%)`
  )

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const { icon: Icon, title, description } = feature

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      className="group relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 overflow-hidden transition-shadow duration-300 hover:shadow-[0_4px_30px_oklch(0.50_0.20_15/10%)]"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: EASE }}
      whileHover={{ y: -3, transition: { duration: 0.18, ease: "easeOut" } }}
    >
      {/* Mouse-tracking spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: spotlightBg }}
      />

      {/* Glowing border on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-brand/0 group-hover:border-brand/25 transition-colors duration-300" />

      {/* Icon */}
      <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-brand/30 bg-brand/10 group-hover:border-brand/50 group-hover:bg-brand/15 transition-all duration-300">
        <Icon className="h-5 w-5 text-brand" />
      </div>

      <div className="relative">
        <h3 className="font-display text-base font-semibold uppercase tracking-wide text-foreground">
          {title}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  )
}

export function FeaturesSection() {
  return (
    <section className="border-t border-border bg-card/30 px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
            Built for Leagues
          </p>
          <h2 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
            Everything your team needs.
          </h2>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
