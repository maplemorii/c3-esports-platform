"use client"

import { useEffect, useRef } from "react"
import { motion, useInView, useMotionValue, useTransform, animate, type Variants } from "framer-motion"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const STATS = [
  { numeric: true,  value: 3,   suffix: "",  label: "Divisions" },
  { numeric: true,  value: 32,  suffix: "+", label: "Teams" },
  { numeric: true,  value: 100, suffix: "+", label: "Matches Played" },
  { numeric: false, value: 0,   suffix: "",  label: "Region", display: "NC/SC" },
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v).toString())

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration: 2.2, ease: EASE })
    }
  }, [inView, value, count])

  return (
    <span ref={ref} className="inline-flex">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <div className="border-y border-border bg-card/50" ref={ref}>
      <div className="mx-auto max-w-5xl px-4">
        <motion.dl
          className="grid grid-cols-2 divide-x divide-border md:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
        >
          {STATS.map(({ numeric, value, suffix, label, display }) => (
            <motion.div
              key={label}
              variants={itemVariants}
              className="flex flex-col items-center gap-1 py-9 px-4"
            >
              <dt className="font-display text-3xl font-bold text-brand sm:text-4xl">
                {numeric ? (
                  <AnimatedCounter value={value} suffix={suffix} />
                ) : (
                  display
                )}
              </dt>
              <dd className="text-xs uppercase tracking-widest text-muted-foreground">
                {label}
              </dd>
            </motion.div>
          ))}
        </motion.dl>
      </div>
    </div>
  )
}
