import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy — Carolina Collegiate Clash",
  description: "Privacy policy for the Carolina Collegiate Clash esports platform.",
}

export default function PrivacyPage() {
  const updated = "March 14, 2026"

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">Legal</p>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
      </div>

      <div className="prose prose-invert prose-sm max-w-none space-y-8 text-muted-foreground leading-relaxed">

        <Section title="Overview">
          Carolina Collegiate Clash (&ldquo;C3&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a
          collegiate Rocket League league platform for students across North and South Carolina.
          This policy explains what information we collect, how we use it, and your rights
          regarding that information.
        </Section>

        <Section title="Information We Collect">
          <p>We collect the following categories of information:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-foreground">Account information</strong> — name, email address, and hashed password when you register with email/password, or your Discord profile information if you sign in via Discord OAuth.</li>
            <li><strong className="text-foreground">Player profile</strong> — display name, Epic Games username, Steam ID, Discord username, and optional bio that you voluntarily provide.</li>
            <li><strong className="text-foreground">Team information</strong> — team name, logo, roster, and season registration details.</li>
            <li><strong className="text-foreground">Match data</strong> — match results, replay files, and statistics submitted through the platform.</li>
            <li><strong className="text-foreground">Usage data</strong> — basic server logs including IP addresses and request timestamps for security and debugging purposes.</li>
          </ul>
        </Section>

        <Section title="Third-Party Account Linking">
          <p>
            When you choose to link a third-party account (Epic Games, Steam), we receive and
            store only the public identifier or display name associated with that account.
            We do not receive passwords or payment information from these services.
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong className="text-foreground">Epic Games</strong> — we receive your Epic display name via Epic Account Services OAuth to verify your Rocket League identity.</li>
            <li><strong className="text-foreground">Steam</strong> — we receive your SteamID64 via Steam OpenID to optionally link your Steam account.</li>
            <li><strong className="text-foreground">Discord</strong> — we receive your Discord username and avatar via Discord OAuth if you choose to sign in or link via Discord.</li>
          </ul>
          <p className="mt-2">
            You may unlink any third-party account at any time from your profile page.
          </p>
        </Section>

        <Section title="How We Use Your Information">
          <ul className="list-disc pl-5 space-y-1">
            <li>To operate the platform and manage league seasons, matches, and standings.</li>
            <li>To verify player identity and prevent duplicate accounts or impersonation.</li>
            <li>To send transactional emails (verification links, match notifications, dispute updates).</li>
            <li>To resolve disputes and maintain a fair competitive environment.</li>
            <li>To detect and prevent abuse, fraud, or violations of our rules.</li>
          </ul>
          <p className="mt-2">
            We do not sell, rent, or share your personal information with third parties for
            marketing purposes.
          </p>
        </Section>

        <Section title="How We Share Your Information">
          <p>
            We share data only with the infrastructure and service providers necessary to operate
            the platform. Each provider processes your data solely to deliver their service to us:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong className="text-foreground">Railway</strong> — cloud hosting that runs our
              application and PostgreSQL database in the United States.
            </li>
            <li>
              <strong className="text-foreground">Cloudflare R2</strong> — object storage for
              uploaded media files (e.g., team logos), hosted in the United States.
            </li>
            <li>
              <strong className="text-foreground">Resend</strong> — transactional email delivery.
              Your email address is transmitted to Resend solely to deliver messages you have
              requested or that are required for platform operation (e.g., email address verification).
            </li>
            <li>
              <strong className="text-foreground">Ballchasing.com</strong> — Rocket League replay
              parsing. When you or your team manager upload a replay file, it is forwarded to
              Ballchasing&apos;s API for statistical analysis. Their{" "}
              <a href="https://ballchasing.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-brand/70 hover:text-brand transition-colors">
                privacy policy
              </a>{" "}
              governs how they handle replay data on their end.
            </li>
            <li>
              <strong className="text-foreground">Discord</strong> — OAuth provider for sign-in
              and account linking. Discord&apos;s{" "}
              <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer"
                className="text-brand/70 hover:text-brand transition-colors">
                privacy policy
              </a>{" "}
              applies to data they receive during the OAuth authorization flow.
            </li>
          </ul>
          <p className="mt-2">
            We do not share your data with advertising networks, data brokers, or any third
            parties beyond the service providers listed above.
          </p>
        </Section>

        <Section title="Data Storage and Security">
          <p>
            Your data is stored in a PostgreSQL database hosted in the United States. Media
            files (team logos) are stored in Cloudflare R2 object storage. We use
            industry-standard security practices including password hashing (bcrypt) and
            encrypted connections (HTTPS/TLS).
          </p>
          <p className="mt-2">
            No system is completely secure. In the event of a data breach we will notify
            affected users promptly.
          </p>
        </Section>

        <Section title="Data Retention">
          <p>
            We retain your account and profile data for as long as your account is active.
            If you request account deletion, we will remove your personal information within
            30 days, except where retention is required by law or for legitimate league
            record-keeping (e.g., historical match results that reference your participation).
          </p>
        </Section>

        <Section title="Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Correct inaccurate information via your profile settings.</li>
            <li>Request deletion of your account and associated personal data.</li>
            <li>Unlink any connected third-party account at any time.</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at the email below.
          </p>
        </Section>

        <Section title="Cookies and Sessions">
          <p>
            We use HTTP-only session cookies to keep you logged in. We do not use
            third-party advertising cookies or tracking pixels.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this policy as the platform evolves. Significant changes will be
            announced on the platform. Continued use after changes constitutes acceptance
            of the updated policy.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this privacy policy or your data? Contact the C3 staff through
            the official Discord server or reach out via the platform.
          </p>
        </Section>

      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-base font-semibold uppercase tracking-widest text-foreground mb-3">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
