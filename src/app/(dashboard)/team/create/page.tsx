"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Users } from "lucide-react"
import { TeamCreateForm } from "@/components/team/TeamCreateForm"

export default function TeamCreatePage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/team" className="hover:text-brand transition-colors">
          My Teams
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Create</span>
      </div>

      {/* Header card */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.7), rgba(59,130,246,0.4), transparent)" }}
          aria-hidden
        />
        <div className="flex items-center gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.2)" }}
          >
            <Users className="h-5 w-5" style={{ color: "rgba(196,28,53,0.9)" }} />
          </div>
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-0.5"
              style={{ color: "rgba(196,28,53,0.8)" }}
            >
              My Teams
            </p>
            <h1 className="font-display text-2xl font-black uppercase tracking-wide">
              Create a Team
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Set up your team profile. You can update logo and colors later.
            </p>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
      >
        <TeamCreateForm
          onSuccess={(id) => router.push(`/team/${id}`)}
          onCancel={() => router.push("/team")}
          cancelLabel="Cancel"
        />
      </div>

    </div>
  )
}
