import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Rules — Carolina Collegiate Clash",
  description: "Official rules and regulations for the Carolina Collegiate Clash Rocket League league.",
}

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <div className="mb-12">
        <p
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: "rgba(167,139,250,0.6)" }}
        >
          Official
        </p>
        <h1
          className="font-sans text-5xl font-black uppercase sm:text-6xl"
          style={{ color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}
        >
          League Rules
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
          All participants are expected to read and abide by these rules. Violations may result in forfeits, suspensions, or removal from the league.
        </p>
        <div
          className="mt-6 h-px w-20"
          style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.6), rgba(6,182,212,0.3), transparent)" }}
        />
      </div>

      <div className="space-y-8">

        <Section title="1. Eligibility">
          <ul className="space-y-2">
            <li>All players must be currently enrolled students at an accredited college or university in North Carolina or South Carolina.</li>
            <li>Players must maintain enrollment throughout the season. If a player drops below half-time enrollment, they are ineligible.</li>
            <li>Each player may only be on one team per season. Playing for multiple teams will result in disqualification of all matches involved.</li>
            <li>Players must have a valid Rocket League account linked to their C3 profile before competing.</li>
          </ul>
        </Section>

        <Section title="2. Roster Requirements">
          <ul className="space-y-2">
            <li>Teams must have a minimum of 3 rostered players and a maximum of 6.</li>
            <li>At least 3 rostered players must be present to field a team for a match.</li>
            <li>Roster locks occur at the start of each season. After the lock date, no new players may be added.</li>
            <li>Teams may designate up to 2 substitutes within their rostered 6.</li>
          </ul>
        </Section>

        <Section title="3. Match Format">
          <ul className="space-y-2">
            <li>All regular season matches are played as a Best of 5 (first to 3 wins) in 3v3 standard format.</li>
            <li>Playoff matches follow a Best of 7 (first to 4 wins) format.</li>
            <li>Matches are played on private servers. The home team (listed first) creates the lobby.</li>
            <li>Server region defaults to US-East unless both teams agree otherwise.</li>
            <li>Mutators must be set to default. Any deviation results in a replay of the game.</li>
          </ul>
        </Section>

        <Section title="4. Scheduling & Check-In">
          <ul className="space-y-2">
            <li>Each match week has an assigned window (typically Thursday–Sunday). Teams must coordinate and play within this window.</li>
            <li>Check-in opens 30 minutes before the agreed match time and closes 10 minutes before. Both teams must check in via the platform.</li>
            <li>If a team fails to check in, the opposing team may claim a forfeit win after waiting 10 minutes past the scheduled start.</li>
            <li>Reschedules must be mutually agreed upon and submitted at least 24 hours before the match window closes.</li>
          </ul>
        </Section>

        <Section title="5. Replay Submission">
          <ul className="space-y-2">
            <li>The winning team is responsible for uploading all game replay files to the platform within 24 hours of match completion.</li>
            <li>Replays must be uploaded via ballchasing.com and linked through the C3 match submission tool.</li>
            <li>Failure to submit replays within the deadline may result in the match being voided or both teams receiving no points.</li>
            <li>Replay files must match the reported scores exactly. Any discrepancy will trigger a staff review.</li>
          </ul>
        </Section>

        <Section title="6. Forfeits">
          <ul className="space-y-2">
            <li>A team that cannot field 3 eligible players by 10 minutes past the scheduled start time forfeits the match.</li>
            <li>Two forfeits in a single season will result in a warning. Three forfeits may result in removal from the season with no refund of registration fees.</li>
            <li>Forfeits due to documented emergencies (natural disasters, server outages) may be reviewed by staff and rescheduled.</li>
          </ul>
        </Section>

        <Section title="7. Conduct">
          <ul className="space-y-2">
            <li>All participants must maintain respectful conduct toward opponents, teammates, and staff at all times.</li>
            <li>Harassment, hate speech, slurs, or targeted abuse of any kind will result in immediate suspension.</li>
            <li>Intentional disconnects, match manipulation, or throwing games for any reason is prohibited and may result in permanent bans.</li>
            <li>Smurfing (using alternate accounts to circumvent rank restrictions) is strictly forbidden.</li>
          </ul>
        </Section>

        <Section title="8. Disputes">
          <ul className="space-y-2">
            <li>Disputes must be filed through the platform within 24 hours of a match completing.</li>
            <li>Include all relevant evidence (screenshots, replay files, Discord logs) in your dispute submission.</li>
            <li>Staff decisions on disputes are final. Attempting to relitigate a closed dispute may result in penalties.</li>
          </ul>
        </Section>

        <Section title="9. Division Placement & Promotion">
          <ul className="space-y-2">
            <li>New teams are placed by staff based on team application information and known skill levels.</li>
            <li>Top finishers in Open Contenders are eligible for promotion to Open Challengers the following season.</li>
            <li>Top finishers in Open Challengers are eligible for promotion to Premier the following season.</li>
            <li>Staff reserve the right to seed or re-seed teams based on exceptional performance.</li>
          </ul>
        </Section>

        <Section title="10. Amendments">
          <p>
            C3 staff reserve the right to amend these rules at any time. Significant changes will be announced in the official Discord server and on this page with a revised date. Continued participation constitutes acceptance of updated rules.
          </p>
        </Section>

      </div>

      <div
        className="mt-14 pt-8 flex items-center justify-between"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <Link
          href="/"
          className="text-xs text-white/30 hover:text-white/65 transition-colors duration-150"
        >
          ← Back to home
        </Link>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>Questions? Reach out in the Discord.</p>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <h2
        className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] mb-4"
        style={{ color: "rgba(167,139,250,0.7)" }}
      >
        {title}
      </h2>
      <div
        className="text-sm leading-relaxed space-y-2"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        {children}
      </div>
    </div>
  )
}
