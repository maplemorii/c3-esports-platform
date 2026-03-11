import Link from "next/link"
import Image from "next/image"
import { AlertTriangle } from "lucide-react"

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
    <div
      className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 overflow-hidden"
      style={{ background: "oklch(0.07 0.02 265)" }}
    >
      {/* Red ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, rgba(220,38,38,0.6) 0%, transparent 70%)", filter: "blur(60px)" }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm text-center">
        <Link href="/" aria-label="C3 Esports — home">
          <Image src="/logo.png" alt="C3 Esports" width={200} height={48} style={{ height: "42px", width: "auto" }} />
        </Link>

        <div
          className="w-full flex flex-col items-center gap-5 rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(220,38,38,0.15)",
            boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)" }}
          >
            <AlertTriangle className="h-5 w-5" style={{ color: "rgba(248,113,113,0.9)" }} />
          </div>

          <div>
            <h1 className="font-sans text-lg font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              Sign In Failed
            </h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              {message}
            </p>
          </div>

          <Link
            href="/auth/signin"
            className="w-full rounded-xl px-4 py-2.5 font-sans text-sm font-semibold text-center transition-all duration-150"
            style={{
              background: "rgba(59,130,246,0.18)",
              border: "1px solid rgba(59,130,246,0.3)",
              color: "rgba(147,197,253,0.9)",
            }}
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}
