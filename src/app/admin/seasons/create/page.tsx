/**
 * /admin/seasons/create
 *
 * Create a new season. Wraps the existing SeasonCreateForm client component.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { SeasonCreateForm } from "@/components/season/SeasonCreateForm"

export const metadata: Metadata = {
  title: "Create Season — Admin — C3 Esports",
}

export default function CreateSeasonPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/seasons" className="hover:text-brand transition-colors">
          Seasons
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Create</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
          New Season
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fill in the details below. Divisions are created automatically.
        </p>
      </div>

      <SeasonCreateForm />

    </div>
  )
}
