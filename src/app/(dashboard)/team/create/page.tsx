"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { TeamCreateForm } from "@/components/team/TeamCreateForm"

export default function TeamCreatePage() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex flex-col gap-1">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-fit -ml-2 gap-1.5 text-muted-foreground mb-2"
          )}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">
          Create a Team
        </h1>
        <p className="text-sm text-muted-foreground">
          Set up your team profile. You can update logo and colors later.
        </p>
      </div>

      <TeamCreateForm
        onSuccess={(id) => router.push(`/team/${id}`)}
        onCancel={() => router.push("/dashboard")}
        cancelLabel="Cancel"
      />
    </div>
  )
}
