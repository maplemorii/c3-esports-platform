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
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">Behind the scenes</p>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide">
          Credits
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          The league was founded by TheNateDog. This platform was designed and built by maplemorii — with a little help from AI.
        </p>
      </div>

      {/* People */}
      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-brand/30 bg-brand/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">League Founder</p>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand/40 bg-brand/10 shrink-0">
              <span className="font-display text-lg font-bold text-brand">N</span>
            </div>
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                TheNateDog
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Founded Carolina Collegiate Clash and built it into the premier collegiate Rocket League league in the Carolinas.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">Platform Developer</p>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card shrink-0">
              <span className="font-display text-lg font-bold text-foreground">M</span>
            </div>
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                maplemorii
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Designed and built this website from scratch — database schema, API, UI, and Discord integrations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tools & tech */}
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-6">
          Built With
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map(({ icon: Icon, name, description }) => (
            <div
              key={name}
              className="flex gap-4 rounded-xl border border-border bg-card p-5 hover:border-brand/30 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
                <Icon className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="font-display text-sm font-semibold uppercase tracking-wide text-foreground">
                  {name}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="rounded-xl border border-border bg-card/50 p-6 text-sm text-muted-foreground leading-relaxed">
        <p>
          This platform was built from scratch as a passion project to give the league a real competitive home online. Every feature — from replay parsing to dispute resolution — was designed with actual league operations in mind.
        </p>
        <p className="mt-3">
          If you want to get involved, report a bug, or suggest a feature, join the{" "}
          <span className="text-foreground font-medium">official Discord</span> and let us know.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
