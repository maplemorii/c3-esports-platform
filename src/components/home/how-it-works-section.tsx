"use client"

import { motion } from "framer-motion"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const STEPS = [
  {
    number: "01",
    title: "Create Your Team",
    description:
      "Register an account, build your roster, and set up your team profile. Add your school, your players, and your identity.",
    detail: "Free to join",
  },
  {
    number: "02",
    title: "Sign Up for a Season",
    description:
      "Submit your registration during the open window. Staff will review your roster and place you into the right division.",
    detail: "Placement guaranteed",
  },
  {
    number: "03",
    title: "Compete Weekly",
    description:
      "Check in on match day, play your series, upload replays, and watch your standing update in real time.",
    detail: "Every match counts",
  },
]

export function HowItWorksSection() {
  return (
    <section className="px-4 py-28">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          className="mb-20"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p
            className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] mb-4"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Getting Started
          </p>
          <h2
            className="font-display font-bold uppercase tracking-tight leading-none"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", color: "white" }}
          >
            Three steps.
            <br />
            <span style={{ color: "rgba(255,255,255,0.25)" }}>You&apos;re competing.</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative grid md:grid-cols-3 gap-12 md:gap-8">
          {/* Connector line (desktop) */}
          <div
            className="absolute top-8 hidden md:block"
            style={{
              left: "calc(16.67% + 1rem)",
              right: "calc(16.67% + 1rem)",
              height: "1px",
            }}
          >
            <motion.div
              className="h-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(124,58,237,0.5) 0%, rgba(6,182,212,0.3) 50%, rgba(124,58,237,0.15) 100%)",
              }}
              initial={{ scaleX: 0, originX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
            />
          </div>

          {STEPS.map(({ number, title, description, detail }, i) => (
            <motion.div
              key={number}
              className="flex flex-col items-center text-center md:items-start md:text-left gap-5"
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.14, ease: EASE }}
            >
              {/* Step circle */}
              <motion.div
                className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
                whileInView={{
                  boxShadow: [
                    "0 0 0px rgba(124,58,237,0)",
                    "0 0 32px rgba(124,58,237,0.40)",
                    "0 0 20px rgba(124,58,237,0.25)",
                  ],
                }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: i * 0.14 + 0.5, ease: "easeOut" }}
              >
                <span
                  className="font-display text-xl font-bold"
                  style={{
                    background: "linear-gradient(135deg, #a855f7, #06b6d4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {number}
                </span>
              </motion.div>

              {/* Content */}
              <div>
                <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-2">
                  {title}
                </h3>
                <p
                  className="font-sans text-sm leading-relaxed mb-3"
                  style={{ color: "rgba(255,255,255,0.40)" }}
                >
                  {description}
                </p>
                <span
                  className="inline-flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                >
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: "rgba(124,58,237,0.7)" }}
                  />
                  {detail}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
