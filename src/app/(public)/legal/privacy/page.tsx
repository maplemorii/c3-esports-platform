import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | C3 Esports",
}

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: "rgba(167,139,250,0.6)" }}
          >
            Legal
          </p>
          <h1
            className="font-sans text-3xl font-bold tracking-tight mb-2"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Privacy Policy
          </h1>
          <p
            className="font-sans text-sm"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            Last updated: January 2025
          </p>
          <div
            className="mt-6 h-px w-20"
            style={{
              background:
                "linear-gradient(90deg, rgba(124,58,237,0.6), rgba(6,182,212,0.3), transparent)",
            }}
          />
        </div>

        {/* Sections */}
        <div className="space-y-0">

          <Section title="1. What We Collect">
            <ul
              className="font-sans text-sm leading-relaxed space-y-2 list-none"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Email address</span> — used for
                account creation and transactional notifications.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Display name</span> — shown
                publicly on team rosters and standings.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Discord username</span> — if you
                link or sign in via Discord OAuth.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Epic Games username</span> — if
                you link your Epic account for Rocket League identity verification.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Match history and replay stats</span> —
                game results, scores, and performance data parsed from uploaded replay files.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>IP address</span> — used for
                rate limiting only; not stored long-term.
              </li>
            </ul>
          </Section>

          <Divider />

          <Section title="2. How We Use It">
            <ul
              className="font-sans text-sm leading-relaxed space-y-2 list-none"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <li>To run the league: match scheduling, standings calculation, and dispute resolution.</li>
              <li>
                To send transactional emails (match results, dispute notices) if you opt in to
                email notifications.
              </li>
              <li>To verify player eligibility and enforce our one-account-per-person policy.</li>
            </ul>
            <p
              className="font-sans text-sm leading-relaxed mt-3"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              We do not sell, rent, or share your personal information with third parties for
              marketing purposes.
            </p>
          </Section>

          <Divider />

          <Section title="3. Third Parties">
            <ul
              className="font-sans text-sm leading-relaxed space-y-2 list-none"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Discord OAuth</span> — used for
                login and account linking.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Ballchasing.com</span> — replay
                parsing. Replay files are forwarded to their API; their own privacy policy applies
                to data they receive.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Resend</span> — transactional
                email delivery.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Railway / PostgreSQL</span> —
                platform and database hosting in the United States.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Sentry</span> — error monitoring.
                Stack traces may include request metadata such as URL paths and user agent strings.
              </li>
            </ul>
          </Section>

          <Divider />

          <Section title="4. Data Retention">
            <p
              className="font-sans text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Account data is retained for as long as your account is active. Replay stats and
              match history are retained indefinitely as part of the permanent public league record.
              If you would like your personal account data deleted, contact us and we will process
              your request within 30 days.
            </p>
          </Section>

          <Divider />

          <Section title="5. Your Rights">
            <ul
              className="font-sans text-sm leading-relaxed space-y-2 list-none"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Account deletion</span> — you can
                delete your account at any time from profile settings (coming soon).
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Email opt-out</span> — you can
                opt out of email notifications in profile settings.
              </li>
              <li>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>Data export</span> — you can
                request a copy of your personal data by emailing us.
              </li>
            </ul>
          </Section>

          <Divider />

          <Section title="6. Cookies">
            <p
              className="font-sans text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              We use session cookies (via NextAuth) solely to keep you logged in across page loads.
              We do not use advertising cookies, tracking pixels, or any third-party analytics
              cookies.
            </p>
          </Section>

          <Divider />

          <Section title="7. Contact">
            <p
              className="font-sans text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Questions about this policy or your data? Reach us at{" "}
              <a
                href="mailto:admin@c3esports.gg"
                className="transition-colors duration-150"
                style={{ color: "rgba(167,139,250,0.85)" }}
              >
                admin@c3esports.gg
              </a>
              .
            </p>
          </Section>

        </div>

        {/* Footer nav */}
        <div
          className="mt-14 pt-8 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Link
            href="/legal/terms"
            className="text-xs transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            ← Terms of Service
          </Link>
          <Link
            href="/contact"
            className="text-xs transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            Contact & Support →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-8">
      <h2
        className="font-sans text-lg font-semibold mb-3"
        style={{ color: "rgba(255,255,255,0.85)" }}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}

function Divider() {
  return (
    <div
      className="h-px"
      style={{ background: "rgba(255,255,255,0.06)" }}
    />
  )
}
