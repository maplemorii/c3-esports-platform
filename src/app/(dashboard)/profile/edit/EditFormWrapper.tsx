"use client"

import { useRouter } from "next/navigation"
import { PlayerProfileForm, type PlayerProfileFormValues } from "@/components/player/PlayerProfileForm"

interface EditFormWrapperProps {
  playerId:      string
  initialValues: PlayerProfileFormValues
}

export function EditFormWrapper({ playerId, initialValues }: EditFormWrapperProps) {
  const router = useRouter()

  return (
    <PlayerProfileForm
      mode="edit"
      playerId={playerId}
      initialValues={initialValues}
      onSuccess={() => {
        setTimeout(() => router.push("/profile"), 800)
      }}
      onCancel={() => router.push("/profile")}
    />
  )
}
