/**
 * Public layout — /(public)/*
 *
 * Thin passthrough — Navbar and Footer are rendered by the root layout.
 * This group exists solely to scope public route conventions (loading,
 * error, not-found) away from authenticated route groups.
 */

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
