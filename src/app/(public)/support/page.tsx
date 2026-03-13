import type { Metadata } from "next"
import Link from "next/link"
import { MessageCircle, Mail, AlertTriangle, HelpCircle, FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Support | C3 Esports",
  description: "Get help with C3 Esports — contact staff, report issues, or find answers to common questions.",
}

const SUPPORT_ITEMS = [
  {
    icon: MessageCircle,
    title: "Discord — Fastest Response",
    description:
      "Join the C3 Esports Discord server for real-time help from staff and the community. Most issues are resolved here within the hour.",
    action: { label: "Join Discord", href: "https://discord.gg/haBGe7FCTw", external: true },
    accent: "blue" as const,
  },
  {
    icon: Mail,
    title: "Email Support",
    description:
      "For account issues, ban appeals, privacy requests, or anything you'd prefer to keep off Discord, email us directly.",
    action: { label: "admin@c3esports.gg", href: "mailto:admin@c3esports.gg", external: false },
    accent: "red" as const,
  },
  {
    icon: AlertTriangle,
    title: "Report a Player or Team",
    description:
      "To report unsportsmanlike conduct, suspected smurfing, or rule violations, reach out via Discord (#report-a-player) or email with evidence.",
    action: { label: "Join Discord", href: "https://discord.gg/haBGe7FCTw", external: true },
    accent: "red" as const,
  },
  {
    icon: FileText,
    title: "Rules & Eligibility",
    description:
      "Review the official competition rules, eligibility requirements, and match procedures before contacting staff.",
    action: { label: "Read the Rules", href: "/rules", external: false },
    accent: "blue" as const,
  },
]

const FAQS = [
  {
    q: "How do I reset my password?",
    a: 'Go to the Sign In page and click "Forgot password". Enter your email and you\'ll receive a reset link valid for 1 hour.',
  },
  {
    q: "I signed up with Discord — how do I set a password?",
    a: "Discord-only accounts cannot use password reset directly. Email admin@c3esports.gg and staff can set up your account.",
  },
  {
    q: "How do I get my .edu email verified?",
    a: "Add your .edu email in your profile settings. A verification link will be sent to that address. If your institution doesn't issue .edu addresses, contact staff for a manual review.",
  },
  {
    q: "My team was rejected — what do I do?",
    a: "Check the staff notes on your registration (visible in your dashboard). If you believe it was an error, reach out via Discord or email.",
  },
  {
    q: "How do I report a no-show or dispute a match result?",
    a: "Use the Dispute button on the match detail page within the dispute window. Attach screenshots or Ballchasing replay links as evidence.",
  },
  {
    q: "How do I delete my account or request my data?",
    a: "Email admin@c3esports.gg with the subject \"Data Request\" or \"Account Deletion\". We'll process your request within 14 days.",
  },
]

export default function SupportPage() {
  return (
    <div className="relative min-h-screen">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-80 w-80 -translate-x-1/2 opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.5), transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-4 py-16 md:py-20 space-y-16">

        {/* Header */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: "rgba(59,130,246,0.7)" }}>
            Help &amp; Support
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight sm:text-6xl">
            We&apos;re Here to Help
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl">
            Choose the best way to reach us — Discord is fastest for most questions.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SUPPORT_ITEMS.map((item) => {
            const Icon = item.icon
            const isRed = item.accent === "red"
            return (
              <div
                key={item.title}
                className="relative overflow-hidden rounded-2xl p-5 flex flex-col gap-4"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: isRed
                      ? "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)"
                      : "linear-gradient(90deg, rgba(59,130,246,0.5), rgba(196,28,53,0.2), transparent)",
                  }}
                  aria-hidden
                />
                <div className="flex items-start gap-3">
                  <div
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={
                      isRed
                        ? { background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.2)" }
                        : { background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }
                    }
                  >
                    <Icon
                      className="h-4 w-4"
                      style={{ color: isRed ? "rgba(196,28,53,0.9)" : "rgba(96,165,250,0.9)" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
                {item.action.external ? (
                  <a
                    href={item.action.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80 w-fit"
                    style={{
                      background: isRed
                        ? "linear-gradient(135deg, rgba(196,28,53,0.8), rgba(59,130,246,0.6))"
                        : "linear-gradient(135deg, rgba(59,130,246,0.8), rgba(196,28,53,0.4))",
                    }}
                  >
                    {item.action.label} ↗
                  </a>
                ) : (
                  <Link
                    href={item.action.href}
                    className="mt-auto inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-80 w-fit"
                    style={{
                      background: isRed
                        ? "linear-gradient(135deg, rgba(196,28,53,0.8), rgba(59,130,246,0.6))"
                        : "linear-gradient(135deg, rgba(59,130,246,0.8), rgba(196,28,53,0.4))",
                    }}
                  >
                    {item.action.label}
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.2)" }}
            >
              <HelpCircle className="h-4 w-4" style={{ color: "rgba(196,28,53,0.8)" }} />
            </div>
            <h2 className="font-display text-xl font-bold uppercase tracking-wide">
              Common Questions
            </h2>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl divide-y divide-[rgba(255,255,255,0.05)]"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
              aria-hidden
            />
            {FAQS.map((faq) => (
              <div key={faq.q} className="px-5 py-4">
                <p className="text-sm font-semibold mb-1">{faq.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground/50 text-center">
          C3 Esports is a student-run organization.{" "}
          <Link href="/legal/terms" className="hover:text-muted-foreground transition-colors underline underline-offset-2">
            Terms of Service
          </Link>
          {" · "}
          <Link href="/legal/privacy" className="hover:text-muted-foreground transition-colors underline underline-offset-2">
            Privacy Policy
          </Link>
        </p>

      </div>
    </div>
  )
}
