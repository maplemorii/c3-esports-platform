"use client"

import { useRef } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const DIVISIONS = [
  {
    tier: "Premier",
    number: "01",
    tagline: "Elite Competition",
    description:
      "Invite-only. The top tier of C3 — reserved for the highest-ranked collegiate teams across the Carolinas. Season champions earn legacy status.",
    topBorder: "linear-gradient(90deg, rgba(234,179,8,0.8) 0%, rgba(234,179,8,0.2) 60%, transparent 100%)",
    spotlightColor: "rgba(234,179,8,0.06)",
    glowColor: "rgba(234,179,8,0.12)",
    numberColor: "rgba(234,179,8,0.06)",
    badgeColor: "rgba(234,179,8,0.15)",
    badgeText: "rgba(234,179,8,0.90)",
    badgeBorder: "rgba(234,179,8,0.25)",
    badge: "PREMIER",
  },
  {
    tier: "Challengers",
    number: "02",
    tagline: "Upper Open Bracket",
    description:
      "For teams climbing toward Premier. Win your way up the bracket, prove your team can compete, and earn your shot at the top division.",
    topBorder: "linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(59,130,246,0.4) 60%, transparent 100%)",
    spotlightColor: "rgba(59,130,246,0.06)",
    glowColor: "rgba(59,130,246,0.12)",
    numberColor: "rgba(59,130,246,0.06)",
    badgeColor: "rgba(59,130,246,0.15)",
    badgeText: "rgba(96,165,250,0.90)",
    badgeBorder: "rgba(59,130,246,0.28)",
    badge: "CHALLENGERS",
  },
  {
    tier: "Contenders",
    number: "03",
    tagline: "Entry Level",
    description:
      "New to collegiate Rocket League? Start here. Learn the format, build team chemistry, and compete in a structured environment built for growth.",
    topBorder: "linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(59,130,246,0.2) 60%, transparent 100%)",
    spotlightColor: "rgba(59,130,246,0.06)",
    glowColor: "rgba(59,130,246,0.12)",
    numberColor: "rgba(59,130,246,0.06)",
    badgeColor: "rgba(59,130,246,0.12)",
    badgeText: "rgba(34,211,238,0.90)",
    badgeBorder: "rgba(59,130,246,0.25)",
    badge: "CONTENDERS",
  },
]

function DivisionCard({
  division,
  index,
}: {
  division: (typeof DIVISIONS)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlightBg = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(400px circle at ${x}px ${y}px, ${division.spotlightColor}, transparent 65%)`
  )

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={isMobile ? undefined : handleMouseMove}
      className="group relative flex flex-col overflow-hidden rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: EASE }}
      whileHover={{
        y: -6,
        boxShadow: `0 20px 60px ${division.glowColor}`,
        transition: { duration: 0.25, ease: "easeOut" },
      }}
    >
      {/* Top gradient border line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: division.topBorder }}
        aria-hidden
      />

      {/* Mouse-tracking spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ background: spotlightBg }}
        aria-hidden
      />

      {/* Giant background number */}
      <div
        className="absolute top-4 right-5 font-display font-bold leading-none pointer-events-none select-none"
        style={{
          fontSize: "clamp(5rem, 10vw, 9rem)",
          color: division.numberColor,
        }}
        aria-hidden
      >
        {division.number}
      </div>

      {/* Content */}
      <div className="relative flex flex-col gap-5 p-8 pt-10 flex-1">
        {/* Badge */}
        <div
          className="inline-flex w-fit items-center rounded-full px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-widest"
          style={{
            background: division.badgeColor,
            border: `1px solid ${division.badgeBorder}`,
            color: division.badgeText,
          }}
        >
          {division.badge}
        </div>

        {/* Tier name + tagline */}
        <div>
          <h3
            className="font-display text-3xl font-bold uppercase tracking-wide text-white leading-none"
          >
            {division.tier}
          </h3>
          <p
            className="font-sans text-xs mt-1.5 tracking-wide"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {division.tagline}
          </p>
        </div>

        {/* Description */}
        <p
          className="font-sans text-sm leading-relaxed flex-1"
          style={{ color: "rgba(255,255,255,0.42)" }}
        >
          {division.description}
        </p>

        {/* Link */}
        <Link
          href="/seasons"
          className="group/link inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wide transition-all duration-200"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          <span className="group-hover/link:text-white transition-colors">Learn more</span>
          <ArrowRight
            className="h-3.5 w-3.5 transition-all duration-200 group-hover/link:translate-x-0.5 group-hover/link:text-white"
          />
        </Link>
      </div>
    </motion.div>
  )
}

export function DivisionsSection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p
            className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] mb-4"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Competition Structure
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2
              className="font-display font-bold uppercase tracking-tight leading-none"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "white" }}
            >
              Three divisions.
              <br />
              <span style={{ color: "rgba(255,255,255,0.25)" }}>One league.</span>
            </h2>
            <p
              className="font-sans text-sm max-w-xs sm:text-right leading-relaxed"
              style={{ color: "rgba(255,255,255,0.32)" }}
            >
              Every team finds their level. Every season, there&apos;s a path forward.
            </p>
          </div>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {DIVISIONS.map((division, i) => (
            <DivisionCard key={division.tier} division={division} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
