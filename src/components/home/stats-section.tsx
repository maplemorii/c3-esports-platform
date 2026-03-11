"use client"

import { useEffect, useRef } from "react"
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const STATS = [
  { numeric: true,  value: 32,  suffix: "+", label: "Teams Competing" },
  { numeric: true,  value: 100, suffix: "+", label: "Matches Played" },
  { numeric: true,  value: 3,   suffix: "",  label: "Divisions" },
  { numeric: false, value: 0,   suffix: "",  label: "Region", display: "NC/SC" },
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toString())

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration: 2.4, ease: EASE })
    }
  }, [inView, value, count])

  return (
    <span ref={ref} className="inline-flex tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section ref={ref} className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="font-sans text-center text-[10px] font-semibold uppercase tracking-[0.28em] mb-14"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          By the numbers
        </motion.p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px"
          style={{ background: "rgba(255,255,255,0.06)", borderRadius: "1rem", overflow: "hidden" }}
        >
          {STATS.map(({ numeric, value, suffix, label, display }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.08, ease: EASE }}
              className="flex flex-col items-center justify-center gap-2 px-6 py-12"
              style={{ background: "oklch(0.07 0.02 265)" }}
            >
              <dt
                className="font-display text-5xl font-bold sm:text-6xl"
                style={{
                  background:
                    i % 2 === 0
                      ? "linear-gradient(135deg, #a855f7, #06b6d4)"
                      : "linear-gradient(135deg, #06b6d4, #a855f7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {numeric ? (
                  <AnimatedCounter value={value} suffix={suffix} />
                ) : (
                  display
                )}
              </dt>
              <dd
                className="font-sans text-[10px] uppercase tracking-[0.22em]"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                {label}
              </dd>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
