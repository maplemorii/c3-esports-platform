"use client"

import { useRef } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { FileVideo, Users, BarChart3, Shield, Zap, Calendar } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/* ── Replay Parsing — large bento card with animated UI mockup ── */
function ReplayCard({ index }: { index: number }) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl lg:col-span-2"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        minHeight: "280px",
      }}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: EASE }}
      whileHover={{
        borderColor: "rgba(124,58,237,0.25)",
        transition: { duration: 0.2 },
      }}
    >
      {/* Top border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.7), rgba(6,182,212,0.4), transparent)" }}
        aria-hidden
      />

      {/* Subtle spotlight on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
        style={{
          background: "radial-gradient(600px circle at 30% 60%, rgba(124,58,237,0.06), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative flex flex-col lg:flex-row h-full">
        {/* Text side */}
        <div className="flex flex-col justify-between p-8 lg:w-1/2">
          <div>
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-5"
              style={{
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.28)",
              }}
            >
              <FileVideo className="h-5 w-5 text-violet-400" />
            </div>
            <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-2">
              Replay Parsing
            </h3>
            <p
              className="font-sans text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              Upload your .replay files — scores, stats, and MVPs are extracted automatically via
              ballchasing.com. No manual entry. No disputes over scorelines.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "rgba(124,58,237,0.8)" }}
            />
            <span
              className="font-sans text-[11px] tracking-wide"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              Powered by ballchasing.com
            </span>
          </div>
        </div>

        {/* UI Mockup side */}
        <div
          className="relative flex-1 p-6 lg:border-l"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {/* Fake file upload UI */}
          <div
            className="rounded-xl p-4 mb-3"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                <FileVideo className="h-4 w-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="font-sans text-xs font-medium text-white truncate"
                >
                  game5_ncstate_vs_unc.replay
                </p>
                <p
                  className="font-sans text-[10px]"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                >
                  4.2 MB · Uploading...
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div
              className="h-0.5 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #7c3aed, #06b6d4)" }}
                animate={{ width: ["0%", "100%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Parsed stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Score", value: "3 – 2" },
              { label: "Goals", value: "NC: 3" },
              { label: "MVP", value: "player1" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg p-2.5 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p
                  className="font-display text-sm font-bold text-white truncate"
                >
                  {value}
                </p>
                <p
                  className="font-sans text-[9px] uppercase tracking-widest mt-0.5"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ── Live Standings — tall bento card with mini table ── */
function StandingsCard({ index }: { index: number }) {
  const teams = [
    { rank: 1, name: "NC State RL", w: 8, l: 0 },
    { rank: 2, name: "UNC Chapel Hill", w: 7, l: 1 },
    { rank: 3, name: "Duke Gaming", w: 6, l: 2 },
    { rank: 4, name: "App State RL", w: 5, l: 3 },
    { rank: 5, name: "Clemson RL", w: 4, l: 4 },
  ]

  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
        minHeight: "280px",
      }}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: EASE }}
      whileHover={{
        borderColor: "rgba(6,182,212,0.25)",
        transition: { duration: 0.2 },
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.7), rgba(124,58,237,0.3), transparent)" }}
        aria-hidden
      />

      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(6,182,212,0.12)",
                border: "1px solid rgba(6,182,212,0.25)",
              }}
            >
              <BarChart3 className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
                Live Standings
              </p>
              <p
                className="font-sans text-[10px]"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Premier Division
              </p>
            </div>
          </div>
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </div>

        <div className="flex-1 space-y-2">
          {teams.map((team, i) => (
            <motion.div
              key={team.name}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.07 + i * 0.06, ease: EASE }}
              className="flex items-center gap-3 rounded-lg px-3 py-2"
              style={{
                background: i === 0 ? "rgba(124,58,237,0.08)" : "transparent",
                border: i === 0 ? "1px solid rgba(124,58,237,0.15)" : "1px solid transparent",
              }}
            >
              <span
                className="font-display text-xs font-bold w-4 tabular-nums"
                style={{
                  color:
                    i === 0
                      ? "rgba(167,139,250,0.9)"
                      : `rgba(255,255,255,${0.45 - i * 0.08})`,
                }}
              >
                {team.rank}
              </span>
              <span
                className="font-sans text-xs flex-1 truncate"
                style={{ color: `rgba(255,255,255,${0.65 - i * 0.10})` }}
              >
                {team.name}
              </span>
              <span
                className="font-sans text-[10px] font-semibold tabular-nums"
                style={{ color: `rgba(255,255,255,${0.40 - i * 0.06})` }}
              >
                {team.w}–{team.l}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ── Standard feature card ── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  accentColor,
  index,
  colSpan,
}: {
  icon: LucideIcon
  title: string
  description: string
  accentColor: string
  index: number
  colSpan?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlightBg = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(300px circle at ${x}px ${y}px, ${accentColor}, transparent 65%)`
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
      className={`group relative overflow-hidden rounded-2xl flex flex-col gap-4 p-7 ${colSpan ?? ""}`}
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.07, ease: EASE }}
      whileHover={{
        y: -4,
        borderColor: "rgba(255,255,255,0.12)",
        transition: { duration: 0.2, ease: "easeOut" },
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 rounded-2xl"
        style={{ background: spotlightBg }}
        aria-hidden
      />

      <div
        className="relative h-10 w-10 rounded-xl flex items-center justify-center"
        style={{
          background: accentColor.replace("0.07", "0.15"),
          border: `1px solid ${accentColor.replace("0.07", "0.28")}`,
        }}
      >
        <Icon className="h-5 w-5" style={{ color: "rgba(255,255,255,0.70)" }} />
      </div>

      <div className="relative">
        <h3 className="font-display text-base font-bold uppercase tracking-wide text-white mb-1.5">
          {title}
        </h3>
        <p
          className="font-sans text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          {description}
        </p>
      </div>
    </motion.div>
  )
}

export function FeaturesSection() {
  const standardFeatures = [
    {
      icon: Users,
      title: "Team Management",
      description:
        "Build your roster, manage substitutes, and register for seasons — all from one unified team dashboard.",
      accentColor: "rgba(124,58,237,0.07)",
    },
    {
      icon: Calendar,
      title: "Scheduled Matches",
      description:
        "Weekly match windows with built-in check-in, grace periods, and automatic forfeit handling.",
      accentColor: "rgba(6,182,212,0.07)",
    },
    {
      icon: Shield,
      title: "Dispute System",
      description:
        "Score conflict? File a dispute with evidence. Staff review with a full audit trail.",
      accentColor: "rgba(124,58,237,0.07)",
    },
    {
      icon: Zap,
      title: "Instant Notifications",
      description:
        "Get alerted when check-in opens, scores are submitted, or staff take action on your team.",
      accentColor: "rgba(6,182,212,0.07)",
      colSpan: "lg:col-span-2",
    },
  ]

  return (
    <section className="px-4 py-24">
      <div
        className="mx-auto max-w-5xl pt-24 pb-0"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
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
            Platform Features
          </p>
          <h2
            className="font-display font-bold uppercase tracking-tight leading-none"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "white" }}
          >
            Built for leagues.
            <br />
            <span style={{ color: "rgba(255,255,255,0.25)" }}>Not spreadsheets.</span>
          </h2>
        </motion.div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1 — large + normal */}
          <ReplayCard index={0} />
          <StandingsCard index={1} />

          {/* Row 2 — 3 standard + 1 wide */}
          {standardFeatures.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i + 2} />
          ))}
        </div>
      </div>
    </section>
  )
}
