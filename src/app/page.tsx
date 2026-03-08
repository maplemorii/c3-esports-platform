import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

const FEATURES = [
  {
    title: "Match Tracking",
    description:
      "Automatic score submission with replay parsing via ballchasing.com. Disputes resolved transparently.",
    icon: "🎯",
  },
  {
    title: "Team Management",
    description:
      "Create your team, manage your roster, and register for seasons — all in one place.",
    icon: "🛡️",
  },
  {
    title: "Live Standings",
    description:
      "Standings update automatically after every completed match. Brackets generated on season publish.",
    icon: "📊",
  },
]

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-32 text-center">
        {/* Diagonal stripe texture */}
        <div className="hero-stripes absolute inset-0" />
        {/* Crimson glow top-left */}
        <div className="absolute -top-32 -left-32 h-125 w-125 rounded-full bg-brand/20 blur-[120px]" />
        {/* Crimson glow bottom-right */}
        <div className="absolute -bottom-32 -right-32 h-100 w-100 rounded-full bg-brand/10 blur-[100px]" />

        <div className="relative flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-sm border border-brand/40 bg-brand/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand">
            Rocket League Competitive Platform
          </div>

          <h1 className="font-display max-w-3xl text-6xl font-bold uppercase tracking-wide sm:text-8xl">
            C3{" "}
            <span className="text-brand">Esports</span>
            <br />
            <span className="text-brand">League</span>
          </h1>

          <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
            Organised Rocket League competition — match scheduling, replay parsing, live standings,
            and double-elimination brackets managed end to end.
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/seasons" className={cn(buttonVariants({ size: "lg" }), "px-8")}>
              View Seasons
            </Link>
            {session ? (
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8")}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-8")}
              >
                Sign In with Discord
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border px-4 py-20">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {FEATURES.map(({ title, description, icon }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 transition-colors hover:border-brand/40"
            >
              <span className="text-3xl">{icon}</span>
              <h3 className="font-display text-lg font-semibold uppercase tracking-wide text-foreground">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
