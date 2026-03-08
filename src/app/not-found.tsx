import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "404 — Page Not Found",
}

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <p className="font-display text-8xl font-bold text-brand select-none">404</p>

      <div className="space-y-2">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">
          Page Not Found
        </h1>
        <p className="text-muted-foreground max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
      >
        Back to Home
      </Link>
    </div>
  )
}
