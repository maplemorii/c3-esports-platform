"use client"

import { motion } from "framer-motion"
import { FileVideo, BarChart3, Users, Calendar } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

/* ── Replay verification mockup ── */
function ReplayMockup() {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(80,130,200,0.12)",
      }}
    >
      {/* File info */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: "rgba(80,130,200,0.12)",
            border: "1px solid rgba(80,130,200,0.20)",
          }}
        >
          <FileVideo
            className="h-4 w-4"
            style={{ color: "rgba(120,170,240,0.85)" }}
          />
        </div>
        <div className="min-w-0">
          <p className="font-sans text-xs font-medium text-white truncate">
            ncstate_vs_unc_g3.replay
          </p>
          <p
            className="font-sans text-[10px]"
            style={{ color: "rgba(255,255,255,0.30)" }}
          >
            4.2 MB
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1 rounded-full overflow-hidden mb-4"
        style={{ background: "rgba(255,255,255,0.05)" }}
      >
        <motion.div
          className="h-full rounded-full origin-left"
          style={{
            background:
              "linear-gradient(90deg, rgba(80,130,200,0.7), rgba(80,130,200,0.4))",
          }}
          animate={{ scaleX: [0, 1] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Parsed data */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Score", value: "3 - 2" },
          { label: "MVP", value: "zephyr" },
          { label: "Status", value: "Verified" },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg p-3 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p
              className="text-sm font-bold text-white truncate"
              style={{ fontFamily: "var(--font-data)" }}
            >
              {value}
            </p>
            <p
              className="font-sans text-[9px] uppercase tracking-widest mt-0.5"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Standings mockup ── */
function StandingsMockup() {
  const teams = [
    { rank: 1, name: "NC State Esports", record: "8-0" },
    { rank: 2, name: "UNC Chapel Hill", record: "7-1" },
    { rank: 3, name: "Duke Gaming", record: "6-2" },
    { rank: 4, name: "Clemson Esports", record: "5-3" },
  ]

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(180,60,60,0.12)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3
            className="h-4 w-4"
            style={{ color: "rgba(180,60,60,0.80)" }}
          />
          <span className="font-sans text-xs font-semibold text-white">
            Rocket League -- S4
          </span>
        </div>
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-emerald-400"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>

      <div className="space-y-1.5">
        {teams.map((team, j) => (
          <div
            key={team.name}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            style={{
              background:
                j === 0 ? "rgba(180,60,60,0.08)" : "transparent",
              border:
                j === 0
                  ? "1px solid rgba(180,60,60,0.12)"
                  : "1px solid transparent",
            }}
          >
            <span
              className="text-xs font-bold w-4 tabular-nums"
              style={{
                fontFamily: "var(--font-data)",
                color:
                  j === 0
                    ? "rgba(180,60,60,0.90)"
                    : `rgba(255,255,255,${0.45 - j * 0.08})`,
              }}
            >
              {team.rank}
            </span>
            <span
              className="font-sans text-xs flex-1 truncate"
              style={{ color: `rgba(255,255,255,${0.65 - j * 0.1})` }}
            >
              {team.name}
            </span>
            <span
              className="text-[10px] font-semibold tabular-nums"
              style={{
                fontFamily: "var(--font-data)",
                color: `rgba(255,255,255,${0.4 - j * 0.06})`,
              }}
            >
              {team.record}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Generic feature mockup placeholder ── */
function MockupPlaceholder({
  Icon,
  accent,
}: {
  Icon: LucideIcon
  accent: string
}) {
  return (
    <div
      className="rounded-xl aspect-[4/3] flex items-center justify-center"
      style={{
        background: `linear-gradient(145deg, rgba(${accent},0.06), rgba(${accent},0.02))`,
        border: `1px solid rgba(${accent},0.10)`,
      }}
    >
      <div className="text-center">
        <Icon
          className="h-10 w-10 mx-auto mb-3"
          style={{ color: `rgba(${accent},0.20)` }}
        />
        <p
          className="font-sans text-xs"
          style={{ color: "rgba(255,255,255,0.18)" }}
        >
          Screenshot placeholder
        </p>
      </div>
    </div>
  )
}

/* ── Feature data ── */
const FEATURES: {
  icon: LucideIcon
  title: string
  description: string
  detail: string
  accent: string
  mockup: "replay" | "standings" | "placeholder"
}[] = [
  {
    icon: FileVideo,
    title: "Automated match verification",
    description:
      "Upload replay files after each series. Scores, stats, and MVPs are extracted and verified automatically. Manual entry and disputes become a thing of the past.",
    detail: "ballchasing.com integration",
    accent: "80,130,200",
    mockup: "replay",
  },
  {
    icon: BarChart3,
    title: "Real-time standings",
    description:
      "Every result updates the league table instantly. Win-loss records, point totals, goal differentials, and head-to-head tiebreakers are all calculated live.",
    detail: "Updated after every match",
    accent: "180,60,60",
    mockup: "standings",
  },
  {
    icon: Users,
    title: "Team management",
    description:
      "Build your roster, add substitutes, set starting lineups, and manage your team profile. One dashboard for captains to handle everything from registration to match day.",
    detail: "Captain dashboard",
    accent: "220,160,40",
    mockup: "placeholder",
  },
  {
    icon: Calendar,
    title: "Structured schedule",
    description:
      "Weekly match windows with built-in check-in, grace periods, and automatic forfeit handling. Know exactly when you play and never miss a match.",
    detail: "Weekly match windows",
    accent: "80,130,200",
    mockup: "placeholder",
  },
]

export function FeaturesSection() {
  return (
    <section className="px-4 md:px-6 lg:px-8 py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Platform
          </p>
          <h2
            className="font-display font-bold tracking-tight leading-[0.95]"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            <span className="text-white">Built for leagues.</span>{" "}
            <span style={{ color: "rgba(255,255,255,0.25)" }}>
              Not spreadsheets.
            </span>
          </h2>
        </motion.div>

        {/* Zigzag feature rows */}
        <div className="space-y-24">
          {FEATURES.map((feature, i) => {
            const isReversed = i % 2 === 1

            return (
              <motion.div
                key={feature.title}
                className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              >
                {/* Text side */}
                <div className={isReversed ? "lg:order-2" : ""}>
                  <div
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl mb-5"
                    style={{
                      background: `rgba(${feature.accent},0.12)`,
                      border: `1px solid rgba(${feature.accent},0.20)`,
                    }}
                  >
                    <feature.icon
                      className="h-5 w-5"
                      style={{ color: `rgba(${feature.accent},0.80)` }}
                    />
                  </div>
                  <h3 className="font-display text-xl lg:text-2xl font-bold text-white tracking-tight mb-3">
                    {feature.title}
                  </h3>
                  <p
                    className="font-sans text-sm leading-relaxed mb-4 max-w-[50ch]"
                    style={{ color: "rgba(255,255,255,0.50)" }}
                  >
                    {feature.description}
                  </p>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: `rgba(${feature.accent},0.50)` }}
                    />
                    <span
                      className="font-sans text-[10px] uppercase tracking-widest"
                      style={{
                        fontFamily: "var(--font-data)",
                        color: `rgba(${feature.accent},0.50)`,
                      }}
                    >
                      {feature.detail}
                    </span>
                  </span>
                </div>

                {/* Mockup side */}
                <div className={isReversed ? "lg:order-1" : ""}>
                  {feature.mockup === "replay" && <ReplayMockup />}
                  {feature.mockup === "standings" && <StandingsMockup />}
                  {feature.mockup === "placeholder" && (
                    <MockupPlaceholder
                      Icon={feature.icon}
                      accent={feature.accent}
                    />
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
