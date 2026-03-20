"use client"

import { motion } from "framer-motion"
import { UserPlus, Trophy, Swords } from "lucide-react"
import type { LucideIcon } from "lucide-react"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const STEPS: {
  number: string
  title: string
  description: string
  Icon: LucideIcon
  accent: string
}[] = [
  {
    number: "01",
    title: "Create your team",
    description:
      "Register, invite your players, and set up your team profile with your school affiliation.",
    Icon: UserPlus,
    accent: "80,130,200",
  },
  {
    number: "02",
    title: "Join a season",
    description:
      "Submit your registration during the open window. Staff review your roster and confirm placement.",
    Icon: Trophy,
    accent: "180,60,60",
  },
  {
    number: "03",
    title: "Compete weekly",
    description:
      "Check in, play your series, submit results. Your standing updates in real time after every match.",
    Icon: Swords,
    accent: "220,160,40",
  },
]

export function HowItWorksSection() {
  return (
    <section className="px-4 md:px-6 lg:px-8 py-28">
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
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Getting Started
          </p>
          <h2
            className="font-display font-bold tracking-tight leading-[0.95]"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            <span className="text-white">Three steps.</span>{" "}
            <span style={{ color: "rgba(255,255,255,0.25)" }}>
              You&apos;re competing.
            </span>
          </h2>
        </motion.div>

        {/* Steps — horizontal */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {STEPS.map(({ number, title, description, accent, Icon }, i) => (
              <motion.div
                key={number}
                className="flex flex-col items-start"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
              >
                {/* Step icon + number */}
                <div className="relative mb-6">
                  <motion.div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: `rgba(${accent},0.08)`,
                      border: `1px solid rgba(${accent},0.18)`,
                    }}
                    whileInView={{
                      boxShadow: [
                        `0 0 0px rgba(${accent},0)`,
                        `0 0 24px rgba(${accent},0.20)`,
                        `0 0 12px rgba(${accent},0.10)`,
                      ],
                    }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.12 + 0.5,
                      ease: "easeOut",
                    }}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: `rgba(${accent},0.75)` }}
                    />
                  </motion.div>
                  <div
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center"
                    style={{
                      background: `rgba(${accent},0.20)`,
                      border: `1px solid rgba(${accent},0.35)`,
                    }}
                  >
                    <span
                      className="text-[10px] font-bold"
                      style={{
                        fontFamily: "var(--font-data)",
                        color: `rgba(${accent},0.90)`,
                      }}
                    >
                      {number}
                    </span>
                  </div>
                </div>

                <h3 className="font-display text-lg font-bold text-white tracking-tight mb-2">
                  {title}
                </h3>
                <p
                  className="font-sans text-sm leading-relaxed"
                  style={{ color: "rgba(255,255,255,0.48)" }}
                >
                  {description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
