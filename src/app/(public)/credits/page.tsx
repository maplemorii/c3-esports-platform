import type { Metadata } from "next"
import Link from "next/link"
import {
  Code2,
  Bot,
  Database,
  Cloud,
  Palette,
  Gamepad2,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Credits — Carolina Collegiate Clash",
  description: "The people and tools behind the Carolina Collegiate Clash platform.",
}

const TOOLS = [
  {
    icon: Code2,
    name: "Next.js & TypeScript",
    description: "App framework and type-safe language powering the entire platform.",
  },
  {
    icon: Database,
    name: "PostgreSQL & Prisma",
    description: "Relational database and ORM handling all league data, rosters, and standings.",
  },
  {
    icon: Cloud,
    name: "Cloudflare R2",
    description: "Object storage for team logos and media assets.",
  },
  {
    icon: Palette,
    name: "Tailwind CSS & shadcn/ui",
    description: "Utility-first styling and accessible component primitives.",
  },
  {
    icon: Gamepad2,
    name: "ballchasing.com",
    description: "Replay parsing API that automatically extracts scores from .replay files.",
  },
  {
    icon: Bot,
    name: "Claude (Anthropic)",
    description: "AI coding assistant that helped design, build, and iterate on this platform.",
  },
]

export default function CreditsPage() {
  return (
    <div className="relative min-h-screen">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.6), transparent 70%)",
          filter: "blur(80px)",
          transform: "translateX(-50%) translateY(-20%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">

        {/* Header */}
        <div className="mb-14">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-brand/70">
            Behind the scenes
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground sm:text-6xl">
            Credits
          </h1>
          <p className="mt-4 max-w-xl text-sm text-muted-foreground leading-relaxed">
            The league was founded by TheNateDog. This platform was designed and built by maplemorii — with a little help from AI.
          </p>
          <div
            className="mt-6 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* People */}
        <div className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-2 lg:max-w-2xl">
          {/* Founder */}
          <div className="relative rounded-2xl overflow-hidden border border-brand/20 bg-brand/5 p-6">
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
              aria-hidden
            />
            <p className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-brand/70">
              League Founder
            </p>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand/40 bg-brand/10">
                <span className="font-display text-lg font-bold text-brand">N</span>
              </div>
              <div>
                <p className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                  TheNateDog
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Founded Carolina Collegiate Clash and built it into the premier collegiate Rocket League league in the Carolinas.
                </p>
              </div>
            </div>
          </div>

          {/* Developer */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-card p-6">
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4) 50%, transparent)" }}
              aria-hidden
            />
            <p className="mb-4 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-brand/70">
              Platform Developer
            </p>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted/30">
                <span className="font-display text-lg font-bold text-foreground">M</span>
              </div>
              <div>
                <p className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                  maplemorii
                </p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Designed and built this website from scratch — database schema, API, UI, and Discord integrations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Built With */}
        <div className="mb-14">
          <p className="mb-6 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-brand/70">
            Built With
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map(({ icon: Icon, name, description }) => (
              <div
                key={name}
                className="group flex gap-4 rounded-xl border border-border bg-card p-5 transition-colors duration-150 hover:border-border/80 hover:bg-muted/10"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand/10">
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                    {name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-2xl border border-border bg-card/50 p-8 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          <p>
            This platform was built from scratch as a passion project to give the league a real competitive home online. Every feature — from replay parsing to dispute resolution — was designed with actual league operations in mind.
          </p>
          <p className="mt-3">
            If you want to get involved, report a bug, or suggest a feature, join the{" "}
            <span className="text-foreground font-medium">official Discord</span> and let us know.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
