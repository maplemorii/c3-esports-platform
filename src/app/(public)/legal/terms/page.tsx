import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | C3 Esports",
}

export default function TermsPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.07 0.02 265)" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <p
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: "rgba(96,165,250,0.6)" }}
          >
            Legal
          </p>
          <h1
            className="font-sans text-3xl font-bold tracking-tight mb-2"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Terms of Service
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
                "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)",
            }}
          />
        </div>

        {/* Sections */}
        <div className="space-y-0">

          <Section title="1. Eligibility">
            <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              To register and compete on the C3 Esports platform you must be currently enrolled at an
              accredited college or university located in the Carolinas region (North Carolina or South
              Carolina). You must have a valid school email address ending in{" "}
              <span style={{ color: "rgba(255,255,255,0.75)" }}>.edu</span>. By completing registration
              you confirm that you meet these eligibility requirements and agree to provide accurate
              enrollment information upon request.
            </p>
          </Section>

          <Divider />

          <Section title="2. Accounts">
            <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Each person may maintain only one account on the platform. You are solely responsible for
              maintaining the security of your account credentials. Do not share your password or allow
              others to access your account. Any activity performed through your account is your
              responsibility. If you suspect unauthorized access, contact us immediately.
            </p>
          </Section>

          <Divider />

          <Section title="3. Fair Play">
            <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              All participants are expected to compete with integrity. The following are strictly
              prohibited: cheating, the use of mods or unauthorized software, exploiting in-game
              bugs for competitive advantage, and unsportsmanlike conduct including the use of
              slurs, harassment of other players or staff, and intentional disconnects. Violations
              may result in match forfeits, suspension, or permanent removal from the platform
              at staff discretion.
            </p>
          </Section>

          <Divider />

          <Section title="4. Match Rules">
            <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Matches must be played as scheduled within the assigned match window. If a dispute
              arises regarding a match result, it must be filed through the platform within{" "}
              <span style={{ color: "rgba(255,255,255,0.75)" }}>24 hours</span> of the match
              completing. All evidence (screenshots, replay files, logs) must be included with
              the dispute submission. Admin decisions on disputes are final and binding.
            </p>
          </Section>

          <Divider />

          <Section title="5. Replays & Data">
            <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              By uploading replay files to the platform you grant C3 Esports a non-exclusive,
              royalty-free license to parse, store, and publicly display the statistics and
              data contained within those files. This includes player performance data,
              game scores, and related match metadata used to populate standings and
              player profiles.
            </p>
          </Section>

          <Divider />

          <Section title="6. Termination">
            <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              We reserve the right to suspend or permanently ban accounts that violate these
              Terms of Service without prior notice. Determinations are made at staff
              discretion and may consider severity, intent, and prior history. If you believe
              an action against your account was made in error, you may appeal by contacting
              us directly.
            </p>
          </Section>

          <Divider />

          <Section title="7. Changes">
            <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              We may update these Terms of Service at any time. When we do, we will revise the
              &ldquo;Last updated&rdquo; date at the top of this page. Significant changes will be
              announced on the platform. Your continued use of the platform after changes are
              posted constitutes your acceptance of the updated terms.
            </p>
          </Section>

          <Divider />

          <Section title="8. Contact">
            <p className="font-sans text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              Questions about these terms? Email us at{" "}
              <a
                href="mailto:admin@c3esports.gg"
                className="transition-colors duration-150"
                style={{ color: "rgba(96,165,250,0.85)" }}
              >
                admin@c3esports.gg
              </a>{" "}
              or visit our{" "}
              <Link
                href="/contact"
                className="transition-colors duration-150"
                style={{ color: "rgba(96,165,250,0.85)" }}
              >
                Contact page
              </Link>
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
            href="/"
            className="text-xs transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            ← Back to home
          </Link>
          <Link
            href="/legal/privacy"
            className="text-xs transition-colors duration-150"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
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
