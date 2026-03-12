import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | C3 Esports",
}

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-80 w-80 opacity-8"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%)",
          filter: "blur(60px)",
          transform: "translate(20%, -20%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-20">

        {/* Header */}
        <div className="mb-14">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-brand/70">
            Legal
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: January 2025</p>
          <div
            className="mt-6 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* Sections */}
        <div className="divide-y divide-border/50">

          <Section title="1. What We Collect">
            <ul className="space-y-2">
              <li><strong className="font-semibold text-foreground/80">Email address</strong> — used for account creation and transactional notifications.</li>
              <li><strong className="font-semibold text-foreground/80">Display name</strong> — shown publicly on team rosters and standings.</li>
              <li><strong className="font-semibold text-foreground/80">Discord username</strong> — if you link or sign in via Discord OAuth.</li>
              <li><strong className="font-semibold text-foreground/80">Epic Games username</strong> — if you link your Epic account for Rocket League identity verification.</li>
              <li><strong className="font-semibold text-foreground/80">Match history and replay stats</strong> — game results, scores, and performance data parsed from uploaded replay files.</li>
              <li><strong className="font-semibold text-foreground/80">IP address</strong> — used for rate limiting only; not stored long-term.</li>
            </ul>
          </Section>

          <Section title="2. How We Use It">
            <ul className="space-y-2 mb-3">
              <li>To run the league: match scheduling, standings calculation, and dispute resolution.</li>
              <li>To send transactional emails (match results, dispute notices) if you opt in to email notifications.</li>
              <li>To verify player eligibility and enforce our one-account-per-person policy.</li>
            </ul>
            <p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </Section>

          <Section title="3. Third Parties">
            <ul className="space-y-2">
              <li><strong className="font-semibold text-foreground/80">Discord OAuth</strong> — used for login and account linking.</li>
              <li><strong className="font-semibold text-foreground/80">Ballchasing.com</strong> — replay parsing. Replay files are forwarded to their API; their own privacy policy applies to data they receive.</li>
              <li><strong className="font-semibold text-foreground/80">Resend</strong> — transactional email delivery.</li>
              <li><strong className="font-semibold text-foreground/80">Railway / PostgreSQL</strong> — platform and database hosting in the United States.</li>
              <li><strong className="font-semibold text-foreground/80">Sentry</strong> — error monitoring. Stack traces may include request metadata such as URL paths and user agent strings.</li>
            </ul>
          </Section>

          <Section title="4. Data Retention">
            <p>
              Account data is retained for as long as your account is active. Replay stats and
              match history are retained indefinitely as part of the permanent public league record.
              If you would like your personal account data deleted, contact us and we will process
              your request within 30 days.
            </p>
          </Section>

          <Section title="5. Your Rights">
            <ul className="space-y-2">
              <li><strong className="font-semibold text-foreground/80">Account deletion</strong> — you can delete your account at any time from profile settings (coming soon).</li>
              <li><strong className="font-semibold text-foreground/80">Email opt-out</strong> — you can opt out of email notifications in profile settings.</li>
              <li><strong className="font-semibold text-foreground/80">Data export</strong> — you can request a copy of your personal data by emailing us.</li>
            </ul>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use session cookies (via NextAuth) solely to keep you logged in across page loads.
              We do not use advertising cookies, tracking pixels, or any third-party analytics cookies.
            </p>
          </Section>

          <Section title="7. Contact">
            <p>
              Questions about this policy or your data? Reach us at{" "}
              <a
                href="mailto:admin@c3esports.gg"
                className="text-brand/80 hover:text-brand transition-colors duration-150"
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
          <Link href="/legal/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
            ← Terms of Service
          </Link>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
            Back to home →
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-8">
      <h2 className="mb-3 font-display text-lg font-semibold uppercase tracking-wide text-foreground/80">
        {title}
      </h2>
      <div className="text-sm leading-relaxed text-muted-foreground [&_li]:flex [&_li]:gap-2 [&_li]:before:content-['·'] [&_li]:before:text-brand/40 [&_li]:before:shrink-0">
        {children}
      </div>
    </div>
  )
}
