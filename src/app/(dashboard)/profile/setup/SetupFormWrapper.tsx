"use client"

import { useRouter } from "next/navigation"
import { PlayerProfileForm } from "@/components/player/PlayerProfileForm"

export function SetupFormWrapper() {
  const router = useRouter()

  return (
    <PlayerProfileForm
      mode="create"
      onSuccess={() => {
        // Small delay so the success state is visible before navigating
        setTimeout(() => router.push("/profile"), 900)
      }}
    />
  )
}
