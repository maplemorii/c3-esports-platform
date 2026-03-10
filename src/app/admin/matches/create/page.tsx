/**
 * /admin/matches/create
 *
 * Staff match scheduler — create a new match for a division.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CalendarClock } from "lucide-react"
import { MatchScheduleForm } from "@/components/staff/MatchScheduleForm"

export const metadata: Metadata = { title: "Schedule Match — Staff" }

export default function AdminCreateMatchPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/matches" className="flex items-center gap-1 hover:text-brand transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Matches
        </Link>
        <span>/</span>
        <span className="text-foreground">Schedule Match</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card">
          <CalendarClock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold uppercase tracking-wider">
            Schedule Match
          </h1>
          <p className="text-xs text-muted-foreground">
            Create a new match for a division.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <MatchScheduleForm mode="create" />
      </div>

    </div>
  )
}
