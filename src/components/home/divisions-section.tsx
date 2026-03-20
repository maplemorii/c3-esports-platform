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
    tagline: "Elite competition",
    description:
      "Invite-only. The top tier of C3 -- reserved for the highest-ranked collegiate teams across the Carolinas. Season champions earn legacy status.",
    accentRgb: "200,165,30",
    badge: "Premier",
  },
  {
    tier: "Challengers",
    number: "02",
    tagline: "Upper open bracket",
    description:
      "For teams climbing toward Premier. Win your way up, prove your team can compete, and earn your shot at the top division.",
    accentRgb: "80,130,200",
    badge: "Challengers",
  },
  {
    tier: "Contenders",
    number: "03",
    tagline: "Entry level",
    description:
      "New to collegiate esports? Start here. Learn the format, build team chemistry, and compete in a structured environment built for growth.",
    accentRgb: "60,180,190",
    badge: "Contenders",
  },
]

function DivisionRow({
  division,
  index,
  reverse,
}: {
  division: (typeof DIVISIONS)[number]
  index: number
  reverse: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlightBg = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(500px circle at ${x}px ${y}px, rgba(${division.accentRgb},0.05), transparent 65%)`
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
      className="group relative overflow-hidden rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.018)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: EASE }}
      whileHover={{
        borderColor: `rgba(${division.accentRgb},0.16)`,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, rgba(${division.accentRgb},0.5) 0%, rgba(${division.accentRgb},0.1) 60%, transparent 100%)`,
        }}
        aria-hidden
      />

      {/* Spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl"
        style={{ background: spotlightBg }}
        aria-hidden
      />

      <div
        className={`relative grid grid-cols-1 md:grid-cols-12 gap-6 p-8 md:p-10 items-center ${
          reverse ? "md:direction-rtl" : ""
        }`}
        style={{ direction: "ltr" }}
      >
        {/* Number + badge side */}
        <div
          className={`md:col-span-4 flex flex-col ${
            reverse ? "md:order-2 md:items-end md:text-right" : "md:order-1"
          }`}
        >
          <div
            className="font-display font-bold leading-none tracking-tight mb-4"
            style={{
              fontSize: "clamp(4rem, 8vw, 6rem)",
              color: `rgba(${division.accentRgb},0.08)`,
            }}
          >
            {division.number}
          </div>
          <div
            className="inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{
              background: `rgba(${division.accentRgb},0.10)`,
              border: `1px solid rgba(${division.accentRgb},0.18)`,
              color: `rgba(${division.accentRgb},0.85)`,
            }}
          >
            {division.badge}
          </div>
        </div>

        {/* Content side */}
        <div
          className={`md:col-span-8 ${
            reverse ? "md:order-1" : "md:order-2"
          }`}
        >
          <h3
            className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white leading-none mb-2"
          >
            {division.tier}
          </h3>
          <p
            className="font-sans text-xs uppercase tracking-widest mb-4"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            {division.tagline}
          </p>
          <p
            className="font-sans text-sm leading-relaxed mb-5 max-w-lg"
            style={{ color: "rgba(255,255,255,0.38)" }}
          >
            {division.description}
          </p>
          <Link
            href="/seasons"
            className="group/link inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wide transition-all duration-200"
            style={{ color: "rgba(255,255,255,0.30)" }}
          >
            <span className="group-hover/link:text-white transition-colors">
              Learn more
            </span>
            <ArrowRight className="h-3.5 w-3.5 transition-all duration-200 group-hover/link:translate-x-0.5 group-hover/link:text-white" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export function DivisionsSection() {
  return (
    <section className="px-6 lg:px-8 py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p
            className="font-sans text-[10px] font-semibold uppercase tracking-[0.25em] mb-4"
            style={{ color: "rgba(255,255,255,0.20)" }}
          >
            Competition structure
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2
              className="font-display font-bold tracking-tight leading-[0.95]"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", color: "white" }}
            >
              Three divisions.
              <br />
              <span style={{ color: "rgba(255,255,255,0.20)" }}>One league.</span>
            </h2>
            <p
              className="font-sans text-sm max-w-xs sm:text-right leading-relaxed"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              Every team finds their level. Every season,
              there is a path forward.
            </p>
          </div>
        </motion.div>

        {/* Zig-zag stacked rows */}
        <div className="space-y-4">
          {DIVISIONS.map((division, i) => (
            <DivisionRow
              key={division.tier}
              division={division}
              index={i}
              reverse={i % 2 === 1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
