import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/20">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-display text-xl font-bold uppercase tracking-wide mb-4"
            >
              <span className="text-brand">C3</span>
              <span className="text-foreground">Esports</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The premier Rocket League league for collegiate players across the Carolinas.
              Compete, climb, and connect.
            </p>
          </div>

          {/* League links */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">
              League
            </h4>
            <nav className="flex flex-col gap-2.5">
              <Link
                href="/seasons"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Seasons
              </Link>
              <Link
                href="/teams"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Teams
              </Link>
              <Link
                href="/rules"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Rules
              </Link>
            </nav>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">
              Platform
            </h4>
            <nav className="flex flex-col gap-2.5">
              <Link
                href="/auth/register"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Register
              </Link>
              <Link
                href="/auth/signin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/credits"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Credits
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-medium text-foreground">C3 Esports</span>. All rights
            reserved.
          </p>
          <p className="text-xs text-muted-foreground/40">Built for collegiate competitors.</p>
        </div>
      </div>
    </footer>
  )
}
