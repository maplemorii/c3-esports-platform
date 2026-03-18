"use client"

import { useRef } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import { useIsMobile } from "@/hooks/useIsMobile"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const GAMES = [
  {
    abbr: "RL",
    name: "Rocket League",
    format: "3v3",
    genre: "Vehicular Soccer",
    status: "Active Season",
    statusLive: true,
    footer: "32+ teams competing",
    description:
      "Our founding title. Compete in structured 3v3 series with automated replay parsing and real-time standings.",
    accentHex: "59,130,246",
    topBorder:
      "linear-gradient(90deg, rgba(59,130,246,0.8) 0%, rgba(59,130,246,0.2) 60%, transparent 100%)",
  },
  {
    abbr: "VAL",
    name: "Valorant",
    format: "5v5",
    genre: "Tactical Shooter",
    status: "Active Season",
    statusLive: true,
    footer: "24+ teams competing",
    description:
      "Carolina's fastest-growing collegiate title. Structured seasons with ranked divisions and playoff brackets.",
    accentHex: "196,28,53",
    topBorder:
      "linear-gradient(90deg, rgba(196,28,53,0.8) 0%, rgba(196,28,53,0.2) 60%, transparent 100%)",
  },
  {
    abbr: "MR",
    name: "Marvel Rivals",
    format: "6v6",
    genre: "Hero Shooter",
    status: "Launching S5",
    statusLive: false,
    footer: "Registration opening soon",
    description:
      "Marvel's breakout hero shooter hits collegiate competition. Season 5 registration opens soon for teams across NC & SC.",
    accentHex: "200,155,60",
    topBorder:
      "linear-gradient(90deg, rgba(200,155,60,0.8) 0%, rgba(200,155,60,0.2) 60%, transparent 100%)",
  },
  {
    abbr: "OW2",
    name: "Overwatch 2",
    format: "5v5",
    genre: "Hero Shooter",
    status: "Coming Soon",
    statusLive: false,
    footer: "Join the waitlist",
    description:
      "Hero shooter competition joins the C3 roster next season. Sign up for first-access registration.",
    accentHex: "250,140,20",
    topBorder:
      "linear-gradient(90deg, rgba(250,140,20,0.8) 0%, rgba(250,140,20,0.2) 60%, transparent 100%)",
  },
]

function GameCard({
  game,
  index,
}: {
  game: (typeof GAMES)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlightBg = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(360px circle at ${x}px ${y}px, rgba(${game.accentHex},0.07), transparent 65%)`
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
        background: "rgba(255,255,255,0.022)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.10, ease: EASE }}
      whileHover={{
        y: -6,
        boxShadow: `0 20px 60px rgba(${game.accentHex},0.10)`,
        borderColor: `rgba(${game.accentHex},0.22)`,
        transition: { duration: 0.25, ease: "easeOut" },
      }}
    >
      {/* Top border accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: game.topBorder }}
        aria-hidden
      />

      {/* Mouse spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ background: spotlightBg }}
        aria-hidden
      />

      {/* Abbr watermark */}
      <div
        className="absolute top-3 right-5 font-display font-bold leading-none pointer-events-none select-none"
        style={{
          fontSize: "clamp(3rem, 5vw, 5.5rem)",
          color: `rgba(${game.accentHex},0.05)`,
        }}
        aria-hidden
      >
        {game.abbr}
      </div>

      <div className="relative flex flex-col gap-4 p-7 pt-9 flex-1">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          {game.statusLive && (
            <motion.div
              className="h-1.5 w-1.5 rounded-full shrink-0"
              style={{ background: `rgba(${game.accentHex},0.9)` }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          )}
          <span
            className="font-sans text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: `rgba(${game.accentHex},0.75)` }}
          >
            {game.status}
          </span>
        </div>

        {/* Game name + format */}
        <div>
          <h3
            className="font-display font-bold uppercase tracking-wide text-white leading-none"
            style={{ fontSize: "clamp(1.35rem, 2.2vw, 1.7rem)" }}
          >
            {game.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="font-sans text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              {game.format}
            </span>
            <span style={{ color: "rgba(255,255,255,0.12)" }}>·</span>
            <span
              className="font-sans text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              {game.genre}
            </span>
          </div>
        </div>

        {/* Description */}
        <p
          className="font-sans text-sm leading-relaxed flex-1"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          {game.description}
        </p>

        {/* Footer detail */}
        <div className="flex items-center gap-2">
          <div
            className="h-1 w-1 rounded-full shrink-0"
            style={{ background: `rgba(${game.accentHex},0.55)` }}
          />
          <span
            className="font-sans text-[11px] font-semibold tracking-wide"
            style={{ color: "rgba(255,255,255,0.22)" }}
          >
            {game.footer}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export function GamesSection() {
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
            Supported Titles
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h2
              className="font-display font-bold uppercase tracking-tight leading-none"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "white" }}
            >
              Your game.
              <br />
              <span style={{ color: "rgba(255,255,255,0.25)" }}>Our league.</span>
            </h2>
            <p
              className="font-sans text-sm max-w-xs sm:text-right leading-relaxed"
              style={{ color: "rgba(255,255,255,0.32)" }}
            >
              From fast cars to firefights — C3 runs structured collegiate competition
              across the titles that matter most in the Carolinas.
            </p>
          </div>
        </motion.div>

        {/* Game cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GAMES.map((game, i) => (
            <GameCard key={game.abbr} game={game} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
