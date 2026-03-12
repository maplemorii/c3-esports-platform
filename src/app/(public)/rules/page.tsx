import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Rules — Carolina Collegiate Clash",
  description: "Official rules and regulations for the Carolina Collegiate Clash Rocket League league.",
}

export default function RulesPage() {
  return (
    <div className="relative min-h-screen">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-96 w-96 opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(196,28,53,0.5), transparent 70%)",
          filter: "blur(80px)",
          transform: "translate(20%, -20%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-6 py-16 md:px-10 md:py-20">

        {/* Header */}
        <div className="mb-14">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-brand/70">
            Official
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground sm:text-6xl">
            League Rules
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            All participants are expected to read and abide by these rules. Violations may result in forfeits, suspensions, or removal from the league.
          </p>
          <div
            className="mt-6 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <Section number="1" title="Eligibility">
            <ul className="space-y-2">
              <li>All players must be currently enrolled students at an accredited college or university in North Carolina or South Carolina.</li>
              <li>Players must maintain enrollment throughout the season. If a player drops below half-time enrollment, they are ineligible.</li>
              <li>Each player may only be on one team per season. Playing for multiple teams will result in disqualification of all matches involved.</li>
              <li>Players must have a valid Rocket League account linked to their C3 profile before competing.</li>
            </ul>
          </Section>

          <Section number="2" title="Roster Requirements">
            <ul className="space-y-2">
              <li>Teams must have a minimum of 3 rostered players and a maximum of 6.</li>
              <li>At least 3 rostered players must be present to field a team for a match.</li>
              <li>Roster locks occur at the start of each season. After the lock date, no new players may be added.</li>
              <li>Teams may designate up to 2 substitutes within their rostered 6.</li>
            </ul>
          </Section>

          <Section number="3" title="Match Format">
            <ul className="space-y-2">
              <li>All regular season matches are played as a Best of 5 (first to 3 wins) in 3v3 standard format.</li>
              <li>Playoff matches follow a Best of 7 (first to 4 wins) format.</li>
              <li>Matches are played on private servers. The home team (listed first) creates the lobby.</li>
              <li>Server region defaults to US-East unless both teams agree otherwise.</li>
              <li>Mutators must be set to default. Any deviation results in a replay of the game.</li>
            </ul>
          </Section>

          <Section number="4" title="Scheduling & Check-In">
            <ul className="space-y-2">
              <li>Each match week has an assigned window (typically Thursday–Sunday). Teams must coordinate and play within this window.</li>
              <li>Check-in opens 30 minutes before the agreed match time and closes 10 minutes before. Both teams must check in via the platform.</li>
              <li>If a team fails to check in, the opposing team may claim a forfeit win after waiting 10 minutes past the scheduled start.</li>
              <li>Reschedules must be mutually agreed upon and submitted at least 24 hours before the match window closes.</li>
            </ul>
          </Section>

          <Section number="5" title="Replay Submission">
            <ul className="space-y-2">
              <li>The winning team is responsible for uploading all game replay files to the platform within 24 hours of match completion.</li>
              <li>Replays must be uploaded via ballchasing.com and linked through the C3 match submission tool.</li>
              <li>Failure to submit replays within the deadline may result in the match being voided or both teams receiving no points.</li>
              <li>Replay files must match the reported scores exactly. Any discrepancy will trigger a staff review.</li>
            </ul>
          </Section>

          <Section number="6" title="Forfeits">
            <ul className="space-y-2">
              <li>A team that cannot field 3 eligible players by 10 minutes past the scheduled start time forfeits the match.</li>
              <li>Two forfeits in a single season will result in a warning. Three forfeits may result in removal from the season with no refund of registration fees.</li>
              <li>Forfeits due to documented emergencies (natural disasters, server outages) may be reviewed by staff and rescheduled.</li>
            </ul>
          </Section>

          <Section number="7" title="Conduct">
            <ul className="space-y-2">
              <li>All participants must maintain respectful conduct toward opponents, teammates, and staff at all times.</li>
              <li>Harassment, hate speech, slurs, or targeted abuse of any kind will result in immediate suspension.</li>
              <li>Intentional disconnects, match manipulation, or throwing games for any reason is prohibited and may result in permanent bans.</li>
              <li>Smurfing (using alternate accounts to circumvent rank restrictions) is strictly forbidden.</li>
            </ul>
          </Section>

          <Section number="8" title="Disputes">
            <ul className="space-y-2">
              <li>Disputes must be filed through the platform within 24 hours of a match completing.</li>
              <li>Include all relevant evidence (screenshots, replay files, Discord logs) in your dispute submission.</li>
              <li>Staff decisions on disputes are final. Attempting to relitigate a closed dispute may result in penalties.</li>
            </ul>
          </Section>

          <Section number="9" title="Division Placement & Promotion">
            <ul className="space-y-2">
              <li>New teams are placed by staff based on team application information and known skill levels.</li>
              <li>Top finishers in Open Contenders are eligible for promotion to Open Challengers the following season.</li>
              <li>Top finishers in Open Challengers are eligible for promotion to Premier the following season.</li>
              <li>Staff reserve the right to seed or re-seed teams based on exceptional performance.</li>
            </ul>
          </Section>

          <Section number="10" title="Amendments">
            <p>
              C3 staff reserve the right to amend these rules at any time. Significant changes will be announced in the official Discord server and on this page with a revised date. Continued participation constitutes acceptance of updated rules.
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div
          className="mt-14 pt-8 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
            ← Back to home
          </Link>
          <p className="text-xs text-muted-foreground/40">Questions? Reach out in the Discord.</p>
        </div>
      </div>
    </div>
  )
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div
      className="group relative rounded-2xl p-6 transition-colors duration-150"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Number + title */}
      <div className="mb-4 flex items-baseline gap-3">
        <span
          className="font-display text-xs font-bold tabular-nums"
          style={{ color: "rgba(196,28,53,0.6)" }}
        >
          {number.padStart(2, "0")}
        </span>
        <h2 className="font-display text-base font-semibold uppercase tracking-widest text-foreground/80">
          {title}
        </h2>
      </div>
      <div className="text-sm leading-relaxed text-muted-foreground [&_li]:flex [&_li]:gap-2 [&_li]:before:content-['·'] [&_li]:before:text-brand/50 [&_li]:before:shrink-0 [&_li]:before:mt-px">
        {children}
      </div>
    </div>
  )
}
