"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const TESTIMONIALS = [
  {
    quote:
      "C3 gave our team a reason to practice seriously. The structure, the standings, the stakes \u2014 it\u2019s real competition, not just scrims.",
    name: "Alex M.",
    role: "Team Captain",
    school: "NC State Esports",
    stars: 5,
  },
  {
    quote:
      "Before C3, we were just a Discord server. Now we\u2019re a registered competitive team with a schedule, stats, and fans.",
    name: "Jordan K.",
    role: "Founder",
    school: "App State Gaming",
    stars: 5,
  },
  {
    quote:
      "The platform handles everything \u2014 scheduling, replays, standings. We just show up and compete.",
    name: "Sam R.",
    role: "Player",
    school: "Clemson Esports",
    stars: 5,
  },
  {
    quote:
      "This is exactly what collegiate esports needed in the Carolinas. Professional infrastructure for student competitors.",
    name: "Dr. Lisa Chen",
    role: "Esports Program Director",
    school: "UNC Charlotte",
    stars: 5,
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5 fill-current"
          style={{ color: "rgba(220,160,40,0.7)" }}
        />
      ))}
    </div>
  )
}

export function TestimonialsSection() {
  return (
    <section className="relative px-4 md:px-6 lg:px-8 py-28">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          className="mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <p
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] mb-3"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Community
          </p>
          <h2
            className="font-display font-bold tracking-tight leading-[0.95]"
            style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
          >
            <span className="text-white">From our players.</span>
          </h2>
        </motion.div>

        {/* Asymmetric grid: 1 large left + 3 stacked right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          {/* Featured testimonial */}
          <motion.div
            className="relative overflow-hidden rounded-2xl p-8 flex flex-col justify-between"
            style={{
              background: "rgba(180,60,60,0.06)",
              border: "1px solid rgba(180,60,60,0.12)",
              minHeight: "320px",
            }}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            whileHover={{
              borderColor: "rgba(180,60,60,0.22)",
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(180,60,60,0.5), transparent)",
              }}
              aria-hidden
            />

            <div>
              <div className="mb-5">
                <StarRating count={TESTIMONIALS[0].stars} />
              </div>
              <blockquote
                className="font-sans text-lg leading-relaxed"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                &ldquo;{TESTIMONIALS[0].quote}&rdquo;
              </blockquote>
            </div>

            <div
              className="flex items-center gap-3 pt-6 mt-6"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(180,60,60,0.15)",
                  border: "1px solid rgba(180,60,60,0.25)",
                }}
              >
                <span
                  className="text-[11px] font-bold"
                  style={{
                    fontFamily: "var(--font-data)",
                    color: "rgba(180,60,60,0.80)",
                  }}
                >
                  {TESTIMONIALS[0].name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <p className="font-sans text-sm font-semibold text-white">
                  {TESTIMONIALS[0].name}
                </p>
                <p
                  className="font-sans text-[11px]"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  {TESTIMONIALS[0].role} -- {TESTIMONIALS[0].school}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right column — 3 smaller */}
          <div className="flex flex-col gap-4">
            {TESTIMONIALS.slice(1).map((t, i) => (
              <motion.div
                key={t.name}
                className="relative overflow-hidden rounded-2xl p-6 flex-1 flex flex-col justify-between"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.6,
                  delay: (i + 1) * 0.08,
                  ease: EASE,
                }}
                whileHover={{
                  borderColor: "rgba(255,255,255,0.14)",
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  },
                }}
              >
                <div>
                  <div className="mb-3">
                    <StarRating count={t.stars} />
                  </div>
                  <blockquote
                    className="font-sans text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.58)" }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                </div>

                <div className="flex items-center gap-2.5 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <span
                      className="text-[9px] font-bold uppercase"
                      style={{
                        fontFamily: "var(--font-data)",
                        color: "rgba(255,255,255,0.30)",
                      }}
                    >
                      {t.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-sans text-xs font-semibold text-white">
                      {t.name}
                    </p>
                    <p
                      className="font-sans text-[10px]"
                      style={{ color: "rgba(255,255,255,0.30)" }}
                    >
                      {t.role} -- {t.school}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
