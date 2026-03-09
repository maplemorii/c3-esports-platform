import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  Trophy,
  Users,
  BarChart3,
  Shield,
  Zap,
  ChevronRight,
  Star,
  Target,
  Calendar,
  FileVideo,
} from "lucide-react"

// ─── Static data ──────────────────────────────────────────────────────────────

const STATS = [
  { value: "3", label: "Divisions" },
  { value: "32+", label: "Teams" },
  { value: "100+", label: "Matches Played" },
  { value: "NC/SC", label: "Region" },
]

const FEATURES = [
  {
    icon: FileVideo,
    title: "Replay Parsing",
    description:
      "Upload your .replay files and scores are extracted automatically via ballchasing.com — no manual entry needed.",
  },
  {
    icon: Users,
    title: "Team Management",
    description:
      "Build your roster, manage substitutes, and register for seasons — all from a unified team dashboard.",
  },
  {
    icon: BarChart3,
    title: "Live Standings",
    description:
      "Standings and game differentials update the moment a match is confirmed. Playoff brackets generate automatically.",
  },
  {
    icon: Calendar,
    title: "Scheduled Matches",
    description:
      "Weekly match windows with built-in check-in, grace periods, and automatic forfeit handling.",
  },
  {
    icon: Shield,
    title: "Dispute System",
    description:
      "Score conflicts? File a dispute with evidence. Staff review and resolve with a full audit trail.",
  },
  {
    icon: Zap,
    title: "Instant Notifications",
    description:
      "Get alerted when check-in opens, scores are submitted, or staff take action on your team.",
  },
]

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
    icon: Target,
  },
]

const STEPS = [
  {
    number: "01",
    title: "Create Your Team",
    description: "Register an account, build your roster, and set up your team profile.",
  },
  {
    number: "02",
    title: "Sign Up for a Season",
    description: "Submit your registration during the open window. Staff will place you in a division.",
  },
  {
    number: "03",
    title: "Compete Weekly",
    description: "Check in on match day, play your series, upload replays, and climb the standings.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex flex-col">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-24 pb-32 text-center">
        {/* Layered background effects */}
        <div className="hero-stripes absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />

        {/* Glow orbs */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-125 w-125 rounded-full bg-brand/15 blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 -left-40 h-75 w-75 rounded-full bg-brand/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 -right-40 h-70 w-70 rounded-full bg-sky-500/8 blur-[100px] pointer-events-none" />

        <div className="relative flex flex-col items-center gap-7 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Season Registration Open
          </div>

          {/* Title */}
          <h1 className="font-display text-6xl font-bold uppercase tracking-tight sm:text-7xl lg:text-8xl leading-none">
            Carolina
            <br />
            <span className="text-brand [text-shadow:0_0_60px_oklch(0.50_0.20_15/40%)]">
              Collegiate
            </span>
            <br />
            Clash
          </h1>

          <p className="max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            The premier Rocket League league for college students across North &amp; South Carolina.
            Compete in structured seasons, climb the divisions, and prove your team belongs at the top.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link
              href="/auth/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "px-8 gap-2 shadow-[0_0_24px_oklch(0.50_0.20_15/30%)] hover:shadow-[0_0_32px_oklch(0.50_0.20_15/50%)] transition-shadow"
              )}
            >
              Register Your Team
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/seasons"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8")}
            >
              View Seasons
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="pt-8 flex flex-col items-center gap-2 text-muted-foreground/50">
            <div className="h-10 w-px bg-linear-to-b from-transparent to-muted-foreground/30" />
          </div>
        </div>
      </section>

      {/* ── Stats strip ─────────────────────────────────────────────── */}
      <div className="border-y border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-4">
          <dl className="grid grid-cols-2 divide-x divide-border md:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-6 px-4">
                <dt className="font-display text-3xl font-bold text-brand sm:text-4xl">{value}</dt>
                <dd className="text-xs uppercase tracking-widest text-muted-foreground">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* ── Divisions ───────────────────────────────────────────────── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
              Competition Structure
            </p>
            <h2 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
              Three Divisions.
              <br />
              <span className="text-muted-foreground">One League.</span>
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {DIVISIONS.map(({ tier, badge, tagline, description, accentClass, badgeClass, dotClass, icon: Icon }) => (
              <div
                key={tier}
                className={cn(
                  "group relative flex flex-col gap-4 rounded-xl border bg-linear-to-b p-6 transition-transform hover:-translate-y-1",
                  accentClass
                )}
              >
                {/* Badge */}
                <div className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest", badgeClass)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
                  {badge}
                </div>

                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="font-display text-xl font-bold uppercase tracking-wide">{tier}</h3>
                    <Icon className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{tagline}</p>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{description}</p>

                <Link
                  href="/seasons"
                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-foreground/70 hover:text-foreground transition-colors group-hover:gap-2"
                >
                  Learn more <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="border-t border-border bg-card/30 px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
              Built for Leagues
            </p>
            <h2 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
              Everything your team needs.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-brand/40"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold uppercase tracking-wide text-foreground">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand">
              Getting Started
            </p>
            <h2 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
              How It Works
            </h2>
          </div>

          <div className="relative grid gap-8 md:grid-cols-3">
            {/* Connector line (desktop only) */}
            <div className="absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-linear-to-r from-transparent via-border to-transparent md:block" />

            {STEPS.map(({ number, title, description }) => (
              <div key={number} className="flex flex-col items-center text-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-brand/40 bg-brand/10 shadow-[0_0_20px_oklch(0.50_0.20_15/20%)] shrink-0">
                  <span className="font-display text-xl font-bold text-brand">{number}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase tracking-wide">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-border px-4 py-24 text-center">
        {/* Background */}
        <div className="hero-stripes absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-linear-to-b from-card/80 to-background/80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-100 w-150 rounded-full bg-brand/10 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-2xl flex flex-col items-center gap-6">
          <h2 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl lg:text-6xl">
            Ready to{" "}
            <span className="text-brand [text-shadow:0_0_40px_oklch(0.50_0.20_15/40%)]">
              Compete?
            </span>
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg max-w-md">
            Registration is open. Form your squad, pick your school, and sign up before spots fill up.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "px-10 shadow-[0_0_24px_oklch(0.50_0.20_15/30%)] hover:shadow-[0_0_32px_oklch(0.50_0.20_15/50%)] transition-shadow"
                )}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "px-10 gap-2 shadow-[0_0_24px_oklch(0.50_0.20_15/30%)] hover:shadow-[0_0_32px_oklch(0.50_0.20_15/50%)] transition-shadow"
                  )}
                >
                  Create an Account
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/auth/signin"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-10")}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
