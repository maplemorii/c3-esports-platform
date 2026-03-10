"use client"

import { motion } from "framer-motion"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const STEPS = [
  {
    number: "01",
    title: "Create Your Team",
    description: "Register an account, build your roster, and set up your team profile.",
  },
  {
    number: "02",
    title: "Sign Up for a Season",
    description:
      "Submit your registration during the open window. Staff will place you in a division.",
  },
  {
    number: "03",
    title: "Compete Weekly",
    description:
      "Check in on match day, play your series, upload replays, and climb the standings.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
            Getting Started
          </p>
          <h2 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
            How It Works
          </h2>
        </motion.div>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Animated connector line (desktop) */}
          <div className="absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px md:block overflow-hidden">
            <motion.div
              className="h-full bg-linear-to-r from-brand/40 via-brand/20 to-brand/40"
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
            />
          </div>

          {STEPS.map(({ number, title, description }, i) => (
            <motion.div
              key={number}
              className="flex flex-col items-center text-center gap-5"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: EASE }}
            >
              {/* Step circle */}
              <motion.div
                className="relative flex h-16 w-16 items-center justify-center rounded-full border border-brand/40 bg-brand/10 shrink-0"
                whileInView={{
                  boxShadow: [
                    "0 0 0px oklch(0.50 0.20 15 / 0%)",
                    "0 0 28px oklch(0.50 0.20 15 / 35%)",
                    "0 0 18px oklch(0.50 0.20 15 / 22%)",
                  ],
                }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, delay: i * 0.15 + 0.4, ease: "easeOut" }}
              >
                <span className="font-display text-xl font-bold text-brand">{number}</span>
              </motion.div>

              <div>
                <h3 className="font-display text-lg font-bold uppercase tracking-wide">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
