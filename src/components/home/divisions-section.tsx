"use client"

import { useRef } from "react"
import { motion, useMotionValue, useTransform } from "framer-motion"
import Link from "next/link"
import { Trophy, Star, Target, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const DIVISIONS = [
  {
    tier: "Premier",
    badge: "PREMIER",
    tagline: "Elite Competition",
    description:
      "The top tier of C3. Invite-only for the highest-ranked collegiate teams in the Carolinas.",
    accentClass: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30",
    badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    dotClass: "bg-yellow-400",
    spotlightColor: "rgba(234,179,8,0.07)",
    glowHover: "group-hover:shadow-[0_8px_40px_rgba(234,179,8,0.12)]",
    icon: Trophy,
  },
  {
    tier: "Open Challengers",
    badge: "CHALLENGERS",
    tagline: "Upper Open Bracket",
    description:
      "For teams looking to climb. Win your way up the bracket and earn a shot at Premier.",
    accentClass: "from-sky-500/20 to-sky-600/5 border-sky-500/30",
    badgeClass: "bg-sky-500/20 text-sky-400 border-sky-500/40",
    dotClass: "bg-sky-400",
    spotlightColor: "rgba(14,165,233,0.07)",
    glowHover: "group-hover:shadow-[0_8px_40px_rgba(14,165,233,0.12)]",
    icon: Star,
  },
  {
    tier: "Open Contenders",
    badge: "CONTENDERS",
    tagline: "Entry Level",
    description:
      "Brand new to collegiate Rocket League? Start here. Learn the format, build chemistry, compete.",
    accentClass: "from-brand/20 to-brand/5 border-brand/30",
    badgeClass: "bg-brand/20 text-brand border-brand/40",
    dotClass: "bg-brand",
    spotlightColor: "rgba(180,30,30,0.07)",
    glowHover: "group-hover:shadow-[0_8px_40px_oklch(0.50_0.20_15/12%)]",
    icon: Target,
  },
]

function SpotlightCard({
  division,
  index,
}: {
  division: (typeof DIVISIONS)[number]
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlightBg = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) =>
      `radial-gradient(380px circle at ${x}px ${y}px, ${division.spotlightColor}, transparent 70%)`
  )

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set(e.clientX - rect.left)
    mouseY.set(e.clientY - rect.top)
  }

  const { tier, badge, tagline, description, accentClass, badgeClass, dotClass, glowHover, icon: Icon } =
    division

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border bg-linear-to-b p-6 overflow-hidden transition-shadow duration-300",
        accentClass,
        glowHover
      )}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: EASE }}
      whileHover={{ y: -5, transition: { duration: 0.2, ease: "easeOut" } }}
    >
      {/* Mouse-tracking spotlight */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: spotlightBg }}
      />

      {/* Badge */}
      <div
        className={cn(
          "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
          badgeClass
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
        {badge}
      </div>

      <div>
        <div className="flex items-start justify-between">
          <h3 className="font-display text-xl font-bold uppercase tracking-wide">{tier}</h3>
          <Icon className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5 group-hover:text-muted-foreground/70 transition-colors duration-200" />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{tagline}</p>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{description}</p>

      <Link
        href="/seasons"
        className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-foreground/60 hover:text-foreground transition-all group-hover:gap-2 duration-200"
      >
        Learn more <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </motion.div>
  )
}

export function DivisionsSection() {
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
            Competition Structure
          </p>
          <h2 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
            Three Divisions.
            <br />
            <span className="text-muted-foreground">One League.</span>
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {DIVISIONS.map((division, i) => (
            <SpotlightCard key={division.tier} division={division} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
