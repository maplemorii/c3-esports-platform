"use client"

import { motion } from "framer-motion"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const STATS = [
  { value: "56+", label: "Registered Teams" },
  { value: "16", label: "Universities" },
  { value: "200+", label: "Matches Played" },
  { value: "2", label: "States" },
]

export function StatsSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Warm gradient background — adds color depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.09 0.015 260) 0%, oklch(0.10 0.025 17 / 40%) 50%, oklch(0.09 0.015 260) 100%)",
        }}
        aria-hidden
      />

      {/* Top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(180,60,60,0.3) 50%, transparent)",
        }}
        aria-hidden
      />

      {/* Bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(80,130,200,0.3) 50%, transparent)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-12 items-center">
          {/* Left — Statement */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <h2
              className="font-display font-bold tracking-tight leading-[0.92]"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.5rem)" }}
            >
              <span className="text-white">Not just a tournament.</span>
              <br />
              <span style={{ color: "rgba(255,255,255,0.22)" }}>
                A league.
              </span>
            </h2>
            <p
              className="font-sans text-sm leading-relaxed mt-5 max-w-[45ch]"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Structured seasons with weekly matches, verified results, official
              standings, and a clear path from registration to championship.
            </p>
          </motion.div>

          {/* Right — Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map(({ value, label }, i) => (
              <motion.div
                key={label}
                className="rounded-xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
              >
                <span
                  className="block text-3xl font-bold text-white tracking-tight mb-1"
                  style={{ fontFamily: "var(--font-data)" }}
                >
                  {value}
                </span>
                <span
                  className="font-sans text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
