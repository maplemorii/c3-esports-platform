import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "There is a problem with the server configuration.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The sign-in link is no longer valid.",
  OAuthCallback: "There was a problem signing in with Discord. Please try again.",
  Default: "An unexpected error occurred during sign in.",
}

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const message = ERROR_MESSAGES[searchParams.error ?? "Default"] ?? ERROR_MESSAGES.Default

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-bold text-destructive">Sign In Failed</h1>
      <p className="max-w-sm text-muted-foreground">{message}</p>
      <Link href="/auth/signin" className={cn(buttonVariants())}>
        Try Again
      </Link>
    </div>
  )
}
