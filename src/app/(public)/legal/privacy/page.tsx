import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | C3 Esports",
  description: "Privacy policy for the C3 Esports collegiate Rocket League platform.",
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
          <p className="mt-3 text-sm text-muted-foreground">Last updated: March 14, 2026</p>
          <div
            className="mt-6 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* Intro */}
        <p className="mb-10 text-sm leading-relaxed text-muted-foreground">
          Carolina Collegiate Clash (&ldquo;C3&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a collegiate
          Rocket League platform for students across North and South Carolina. This policy explains
          what information we collect, how we use it, how we share it, and your rights regarding
          that information.
        </p>

        {/* Sections */}
        <div className="divide-y divide-border/50">

          <Section title="1. What We Collect">
            <ul className="space-y-2">
              <li><strong>Account information</strong> — email address and hashed password when registering with email, or your Discord profile (username, avatar) when signing in via Discord OAuth.</li>
              <li><strong>Player profile</strong> — display name, Epic Games username, Steam ID, Discord username, and optional bio that you voluntarily provide.</li>
              <li><strong>Team information</strong> — team name, logo, roster composition, and season registration details.</li>
              <li><strong>Match &amp; replay data</strong> — game results, scores, and per-player statistics parsed from Rocket League replay files you upload.</li>
              <li><strong>Usage data</strong> — server logs including IP addresses and request timestamps, used for security, rate limiting, and debugging. IP addresses are not stored long-term.</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="space-y-2 mb-3">
              <li>To operate the league: match scheduling, standings calculation, and dispute resolution.</li>
              <li>To send transactional emails — verification links, match notifications, and dispute updates.</li>
              <li>To verify player eligibility and enforce our one-account-per-person policy.</li>
              <li>To detect and prevent abuse, fraud, and violations of our rules.</li>
            </ul>
            <p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </Section>

          <Section title="3. Third-Party Account Linking">
            <p className="mb-3">
              When you link a third-party account we receive only the public identifier or display
              name needed for that integration. We do not receive passwords or payment information.
            </p>
            <ul className="space-y-2">
              <li><strong>Discord</strong> — username and avatar, received via Discord OAuth for sign-in and account linking.</li>
              <li><strong>Epic Games</strong> — your Epic display name, received via Epic Account Services OAuth to verify your Rocket League identity.</li>
              <li><strong>Steam</strong> — your SteamID64, received via Steam OpenID if you optionally link your Steam account.</li>
            </ul>
            <p className="mt-3">You may unlink any third-party account at any time from your profile settings.</p>
          </Section>

          <Section title="4. How We Share Your Information">
            <p className="mb-3">
              We share data only with the infrastructure and service providers necessary to run the
              platform. Each provider processes your data solely to deliver their service to us:
            </p>
            <ul className="space-y-2">
              <li>
                <strong>Railway</strong> — cloud hosting that runs our application and PostgreSQL
                database in the United States.
              </li>
              <li>
                <strong>Cloudflare R2</strong> — object storage for uploaded media files (e.g., team
                logos), hosted in the United States.
              </li>
              <li>
                <strong>Resend</strong> — transactional email delivery. Your email address is
                transmitted to Resend solely to deliver messages you have requested or that are
                required for platform operation (e.g., email address verification).
              </li>
              <li>
                <strong>Ballchasing.com</strong> — Rocket League replay parsing. When you or your
                team manager upload a replay file, it is forwarded to Ballchasing&apos;s API for
                statistical analysis. Their{" "}
                <a
                  href="https://ballchasing.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand/80 hover:text-brand transition-colors duration-150"
                >
                  privacy policy
                </a>{" "}
                governs how they handle replay data on their end.
              </li>
              <li>
                <strong>Discord</strong> — OAuth provider for sign-in and account linking.
                Discord&apos;s{" "}
                <a
                  href="https://discord.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand/80 hover:text-brand transition-colors duration-150"
                >
                  privacy policy
                </a>{" "}
                applies to data they receive during the OAuth authorization flow.
              </li>
            </ul>
            <p className="mt-3">
              We do not share your data with advertising networks, data brokers, or any third
              parties beyond the service providers listed above.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              Account and profile data is retained for as long as your account is active. Replay
              stats and match history are retained indefinitely as part of the permanent public
              league record. If you request account deletion, we will remove your personal
              information within 30 days, except where retention is required by law or for
              legitimate record-keeping (e.g., historical match results that reference your
              participation).
            </p>
          </Section>

          <Section title="6. Data Storage &amp; Security">
            <p>
              Your data is stored in a PostgreSQL database hosted in the United States. Media files
              are stored in Cloudflare R2 object storage. We use industry-standard security practices
              including password hashing (bcrypt) and encrypted connections (HTTPS/TLS). No system is
              completely secure — in the event of a data breach we will notify affected users promptly.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <ul className="space-y-2">
              <li><strong>Account deletion</strong> — delete your account at any time from profile settings. Personal data is removed within 30 days.</li>
              <li><strong>Correction</strong> — update inaccurate information at any time via your profile settings.</li>
              <li><strong>Email opt-out</strong> — opt out of non-essential email notifications in profile settings.</li>
              <li><strong>Data export</strong> — request a copy of your personal data by contacting us.</li>
              <li><strong>Unlink accounts</strong> — disconnect any linked third-party account from your profile settings.</li>
            </ul>
          </Section>

          <Section title="8. Cookies &amp; Sessions">
            <p>
              We use HTTP-only session cookies solely to keep you logged in across page loads. We do
              not use advertising cookies, tracking pixels, or any third-party analytics.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this policy as the platform evolves. Significant changes will be
              announced on the platform. Continued use after changes constitutes acceptance of the
              updated policy.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions about this policy or your data? Reach us at{" "}
              <a
                href="mailto:admin@c3esports.com"
                className="text-brand/80 hover:text-brand transition-colors duration-150"
              >
                admin@c3esports.com
              </a>{" "}
              or through the official Discord server.
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
      <div className="text-sm leading-relaxed text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_li]:leading-relaxed">
        {children}
      </div>
    </div>
  )
}
