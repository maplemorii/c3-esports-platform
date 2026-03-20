"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const GAMES = [
  {
    id: "rl",
    name: "Rocket League",
    format: "3v3",
    description:
      "High-octane car soccer with aerial mechanics and split-second team plays. The fastest game in the league.",
    accent: "80,130,200",
    image: "/games/rl.svg",
  },
  {
    id: "val",
    name: "Valorant",
    format: "5v5",
    description:
      "Tactical shooter combining precise gunplay with agent abilities. Strategy meets reflexes.",
    accent: "180,60,60",
    image: "/games/val.svg",
  },
  {
    id: "ow2",
    name: "Overwatch 2",
    format: "5v5",
    description:
      "Team-based hero shooter where coordination and role synergy decide every engagement.",
    accent: "220,160,40",
    image: "/games/ow2.svg",
  },
]

export function GamesSection() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <section className="px-4 md:px-6 lg:px-8 py-24">
      <div className="mx-auto max-w-7xl">
        {/* Header — left aligned */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Game Titles
          </p>
          <h2
            className="font-display font-bold tracking-tight leading-[0.95]"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            <span className="text-white">Three games.</span>{" "}
            <span style={{ color: "rgba(255,255,255,0.25)" }}>One league.</span>
          </h2>
        </motion.div>

        {/* Desktop: Accordion strips */}
        <div className="hidden lg:flex gap-3 h-[420px]">
          {GAMES.map((game, i) => {
            const isActive = activeIndex === i

            return (
              <motion.div
                key={game.id}
                className="relative overflow-hidden rounded-2xl cursor-pointer group"
                style={{
                  border: `1px solid rgba(${game.accent},${isActive ? 0.3 : 0.1})`,
                }}
                animate={{ flex: isActive ? 3 : 1 }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 26,
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {/* Background image */}
                <Image
                  src={game.image}
                  alt=""
                  fill
                  className="object-cover transition-all duration-700"
                  style={{
                    opacity: isActive ? 0.6 : 0.25,
                    scale: isActive ? "1.05" : "1",
                  }}
                  aria-hidden
                />

                {/* Gradient overlay for text legibility */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(0deg, oklch(0.09 0.015 260) 10%, rgba(${game.accent},0.08) 50%, transparent 100%)`,
                  }}
                />

                {/* Radial glow on active */}
                <div
                  className="absolute inset-0 transition-opacity duration-500"
                  style={{
                    opacity: isActive ? 1 : 0,
                    background: `radial-gradient(circle at 50% 40%, rgba(${game.accent},0.15) 0%, transparent 65%)`,
                  }}
                  aria-hidden
                />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-8">
                  {/* Format badge */}
                  <span
                    className="inline-block w-fit text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded mb-3"
                    style={{
                      fontFamily: "var(--font-data)",
                      color: `rgba(${game.accent},0.85)`,
                      background: `rgba(${game.accent},0.12)`,
                      border: `1px solid rgba(${game.accent},0.22)`,
                    }}
                  >
                    {game.format}
                  </span>

                  <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                    {game.name}
                  </h3>

                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        className="font-sans text-sm leading-relaxed mt-3 max-w-[35ch]"
                        style={{ color: "rgba(255,255,255,0.50)" }}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: EASE }}
                      >
                        {game.description}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Top accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-400"
                  style={{
                    background: `linear-gradient(90deg, rgba(${game.accent},${isActive ? 0.6 : 0.15}), transparent)`,
                  }}
                  aria-hidden
                />
              </motion.div>
            )
          })}
        </div>

        {/* Mobile: Stacked cards */}
        <div className="flex flex-col gap-4 lg:hidden">
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              className="relative overflow-hidden rounded-2xl p-6"
              style={{
                border: `1px solid rgba(${game.accent},0.15)`,
              }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}
            >
              {/* Background image */}
              <Image
                src={game.image}
                alt=""
                fill
                className="object-cover opacity-30"
                aria-hidden
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(145deg, rgba(${game.accent},0.08) 0%, oklch(0.09 0.015 260) 80%)`,
                }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(90deg, rgba(${game.accent},0.5), transparent)`,
                }}
                aria-hidden
              />
              <span
                className="relative inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded mb-3"
                style={{
                  fontFamily: "var(--font-data)",
                  color: `rgba(${game.accent},0.85)`,
                  background: `rgba(${game.accent},0.10)`,
                }}
              >
                {game.format}
              </span>
              <h3 className="relative font-display text-xl font-bold text-white tracking-tight mb-2">
                {game.name}
              </h3>
              <p
                className="relative font-sans text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.50)" }}
              >
                {game.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
