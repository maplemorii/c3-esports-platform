import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | C3 Esports",
}

export default function TermsPage() {
  return (
    <div className="relative min-h-screen">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-0 h-80 w-80 opacity-8"
        style={{
          background: "radial-gradient(circle, rgba(196,28,53,0.4), transparent 70%)",
          filter: "blur(60px)",
          transform: "translate(-20%, -20%)",
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
            Terms of Service
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">Last updated: January 2025</p>
          <div
            className="mt-6 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* Sections */}
        <div className="divide-y divide-border/50">

          <Section title="1. Eligibility">
            <p>
              To register and compete on the C3 Esports platform you must be currently enrolled at an
              accredited college or university located in the Carolinas region (North Carolina or South
              Carolina). You must have a valid school email address ending in{" "}
              <strong className="font-semibold text-foreground/80">.edu</strong>. By completing registration
              you confirm that you meet these eligibility requirements and agree to provide accurate
              enrollment information upon request.
            </p>
          </Section>

          <Section title="2. Accounts">
            <p>
              Each person may maintain only one account on the platform. You are solely responsible for
              maintaining the security of your account credentials. Do not share your password or allow
              others to access your account. Any activity performed through your account is your
              responsibility. If you suspect unauthorized access, contact us immediately.
            </p>
          </Section>

          <Section title="3. Fair Play">
            <p>
              All participants are expected to compete with integrity. The following are strictly
              prohibited: cheating, the use of mods or unauthorized software, exploiting in-game
              bugs for competitive advantage, and unsportsmanlike conduct including the use of
              slurs, harassment of other players or staff, and intentional disconnects. Violations
              may result in match forfeits, suspension, or permanent removal from the platform
              at staff discretion.
            </p>
          </Section>

          <Section title="4. Match Rules">
            <p>
              Matches must be played as scheduled within the assigned match window. If a dispute
              arises regarding a match result, it must be filed through the platform within{" "}
              <strong className="font-semibold text-foreground/80">24 hours</strong> of the match
              completing. All evidence (screenshots, replay files, logs) must be included with
              the dispute submission. Admin decisions on disputes are final and binding.
            </p>
          </Section>

          <Section title="5. Replays & Data">
            <p>
              By uploading replay files to the platform you grant C3 Esports a non-exclusive,
              royalty-free license to parse, store, and publicly display the statistics and
              data contained within those files. This includes player performance data,
              game scores, and related match metadata used to populate standings and
              player profiles.
            </p>
          </Section>

          <Section title="6. Termination">
            <p>
              We reserve the right to suspend or permanently ban accounts that violate these
              Terms of Service without prior notice. Determinations are made at staff
              discretion and may consider severity, intent, and prior history. If you believe
              an action against your account was made in error, you may appeal by contacting
              us directly.
            </p>
          </Section>

          <Section title="7. Changes">
            <p>
              We may update these Terms of Service at any time. When we do, we will revise the
              &ldquo;Last updated&rdquo; date at the top of this page. Significant changes will be
              announced on the platform. Your continued use of the platform after changes are
              posted constitutes your acceptance of the updated terms.
            </p>
          </Section>

          <Section title="8. Contact">
            <p>
              Questions about these terms? Email us at{" "}
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
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
            ← Back to home
          </Link>
          <Link href="/legal/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
            Privacy Policy →
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
      <div className="text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </div>
  )
}
