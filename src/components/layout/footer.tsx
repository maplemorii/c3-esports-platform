import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()}{" "}
          <span className="font-medium text-foreground">C3 Esports</span>. All rights reserved.
        </p>
        <nav className="flex gap-6">
          <Link href="/seasons" className="hover:text-foreground transition-colors">
            Seasons
          </Link>
          <Link href="/teams" className="hover:text-foreground transition-colors">
            Teams
          </Link>
          <Link href="/rules" className="hover:text-foreground transition-colors">
            Rules
          </Link>
          <Link href="/credits" className="hover:text-foreground transition-colors">
            Credits
          </Link>
        </nav>
      </div>
    </footer>
  )
}
