import {
  Github,
  Instagram,
  Twitter,
  Mail,
  MapPin,
  MessageCircle,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const data = {
  social: {
    discord:   "https://discord.gg/c3esports",
    twitter:   "https://twitter.com/c3esports",
    instagram: "https://instagram.com/c3esports",
    github:    "https://github.com/c3esports",
  },
  league: [
    { text: "Seasons",   href: "/seasons" },
    { text: "Teams",     href: "/teams" },
    { text: "Rules",     href: "/rules" },
    { text: "Schedule",  href: "/schedule" },
  ],
  platform: [
    { text: "Register",   href: "/auth/register" },
    { text: "Sign In",    href: "/auth/signin" },
    { text: "Dashboard",  href: "/dashboard" },
    { text: "Support",    href: "/support" },
  ],
  legal: [
    { text: "Terms of Service", href: "/legal/terms" },
    { text: "Privacy Policy",   href: "/legal/privacy" },
    { text: "Credits",          href: "/credits" },
  ],
  contact: [
    { icon: MessageCircle, text: "discord.gg/c3esports",  href: "https://discord.gg/c3esports" },
    { icon: Mail,          text: "hello@c3esports.com",   href: "mailto:hello@c3esports.com" },
    { icon: MapPin,        text: "North & South Carolina" },
  ],
}

const socialLinks = [
  { icon: MessageCircle, label: "Discord",   href: data.social.discord },
  { icon: Twitter,       label: "Twitter",   href: data.social.twitter },
  { icon: Instagram,     label: "Instagram", href: data.social.instagram },
  { icon: Github,        label: "GitHub",    href: data.social.github },
]

export function FooterColumn() {
  return (
    <footer
      className="w-full"
      style={{
        borderTop: "1px solid rgba(59,130,246,0.12)",
        background: "oklch(0.08 0.022 265)",
      }}
    >
      <div className="mx-auto max-w-screen-xl px-6 pt-16 pb-8 lg:px-8 lg:pt-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">

          {/* ── Brand block ── */}
          <div className="flex flex-col items-center sm:items-start">
            <Link href="/" aria-label="C3 Esports home">
              <Image
                src="/logo.png"
                alt="C3 Esports"
                width={200}
                height={48}
                style={{ height: "28px", width: "auto", opacity: 0.85 }}
              />
            </Link>

            <p
              className="mt-6 max-w-xs text-center text-sm leading-relaxed sm:text-left"
              style={{ color: "rgba(255,255,255,0.30)" }}
            >
              The premier collegiate esports league for players across North &amp; South Carolina. Structured seasons. Real stakes. Every game.
            </p>

            {/* Social icons */}
            <ul className="mt-8 flex items-center gap-5">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex items-center justify-center h-9 w-9 rounded-full transition-colors duration-200"
                    style={{
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.35)",
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)"
                      ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(196,28,53,0.5)"
                      ;(e.currentTarget as HTMLElement).style.background = "rgba(196,28,53,0.08)"
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.35)"
                      ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"
                      ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Brand accent line */}
            <div
              className="mt-10 h-px w-20"
              style={{
                background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)",
              }}
              aria-hidden
            />
          </div>

          {/* ── Nav columns ── */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-2">

            {/* League */}
            <div className="text-center sm:text-left">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.25em]"
                 style={{ color: "rgba(255,255,255,0.22)" }}>
                League
              </p>
              <ul className="mt-6 space-y-3">
                {data.league.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className="text-sm transition-colors duration-150"
                      style={{ color: "rgba(255,255,255,0.38)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)" }}
                    >
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div className="text-center sm:text-left">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.25em]"
                 style={{ color: "rgba(255,255,255,0.22)" }}>
                Platform
              </p>
              <ul className="mt-6 space-y-3">
                {data.platform.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className="text-sm transition-colors duration-150"
                      style={{ color: "rgba(255,255,255,0.38)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)" }}
                    >
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="text-center sm:text-left">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.25em]"
                 style={{ color: "rgba(255,255,255,0.22)" }}>
                Legal
              </p>
              <ul className="mt-6 space-y-3">
                {data.legal.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className="text-sm transition-colors duration-150"
                      style={{ color: "rgba(255,255,255,0.38)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)" }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.38)" }}
                    >
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center sm:text-left">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.25em]"
                 style={{ color: "rgba(255,255,255,0.22)" }}>
                Contact
              </p>
              <ul className="mt-6 space-y-4">
                {data.contact.map(({ icon: Icon, text, href }) => (
                  <li key={text}>
                    {href ? (
                      <Link
                        href={href}
                        className="flex items-start gap-2 group"
                      >
                        <Icon
                          className="h-4 w-4 mt-0.5 shrink-0 transition-colors duration-150"
                          style={{ color: "rgba(196,28,53,0.7)" }}
                        />
                        <span
                          className="text-sm leading-snug transition-colors duration-150"
                          style={{ color: "rgba(255,255,255,0.38)" }}
                        >
                          {text}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-2">
                        <Icon
                          className="h-4 w-4 mt-0.5 shrink-0"
                          style={{ color: "rgba(196,28,53,0.7)" }}
                        />
                        <span
                          className="text-sm leading-snug"
                          style={{ color: "rgba(255,255,255,0.38)" }}
                        >
                          {text}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="mt-16 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-xs text-center sm:text-left" style={{ color: "rgba(255,255,255,0.20)" }}>
            &copy; {new Date().getFullYear()}{" "}
            <span style={{ color: "rgba(255,255,255,0.40)" }}>C3 Esports</span>
            . All rights reserved.
          </p>
          <p className="text-xs text-center sm:text-right" style={{ color: "rgba(255,255,255,0.12)" }}>
            Built for collegiate competitors.
          </p>
        </div>
      </div>
    </footer>
  )
}
