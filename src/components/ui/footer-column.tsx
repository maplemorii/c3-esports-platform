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
    discord: "https://discord.gg/c3esports",
    twitter: "https://twitter.com/c3esports",
    instagram: "https://instagram.com/c3esports",
    github: "https://github.com/c3esports",
  },
  league: [
    { text: "Seasons", href: "/seasons" },
    { text: "Teams", href: "/teams" },
    { text: "Rules", href: "/rules" },
    { text: "Schedule", href: "/schedule" },
  ],
  platform: [
    { text: "Register", href: "/auth/register" },
    { text: "Sign in", href: "/auth/signin" },
    { text: "Dashboard", href: "/dashboard" },
    { text: "Support", href: "/support" },
  ],
  legal: [
    { text: "Terms of Service", href: "/legal/terms" },
    { text: "Privacy Policy", href: "/legal/privacy" },
    { text: "Credits", href: "/credits" },
  ],
  contact: [
    { icon: MessageCircle, text: "discord.gg/c3esports", href: "https://discord.gg/c3esports" },
    { icon: Mail, text: "hello@c3esports.com", href: "mailto:hello@c3esports.com" },
    { icon: MapPin, text: "North & South Carolina" },
  ],
}

const socialLinks = [
  { icon: MessageCircle, label: "Discord", href: data.social.discord },
  { icon: Twitter, label: "Twitter", href: data.social.twitter },
  { icon: Instagram, label: "Instagram", href: data.social.instagram },
  { icon: Github, label: "GitHub", href: data.social.github },
]

export function FooterColumn() {
  return (
    <footer
      className="w-full"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "oklch(0.07 0.014 260)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-8 lg:px-8 lg:pt-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Brand block */}
          <div className="flex flex-col items-center sm:items-start">
            <Link href="/" aria-label="C3 Esports home">
              <Image
                src="/logo.png"
                alt="C3 Esports"
                width={200}
                height={48}
                style={{ height: "26px", width: "auto", opacity: 0.75 }}
              />
            </Link>

            <p
              className="mt-5 max-w-xs text-center text-sm leading-relaxed sm:text-left"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              The collegiate esports league for players across
              North and South Carolina.
            </p>

            {/* Social */}
            <ul className="mt-7 flex items-center gap-4">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200"
                    style={{
                      border: "1px solid rgba(255,255,255,0.05)",
                      background: "rgba(255,255,255,0.02)",
                      color: "rgba(255,255,255,0.28)",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-2">
            {/* League */}
            <div className="text-center sm:text-left">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{
                  fontFamily: "var(--font-data)",
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                League
              </p>
              <ul className="mt-5 space-y-2.5">
                {data.league.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className="text-sm transition-colors duration-150"
                      style={{ color: "rgba(255,255,255,0.32)" }}
                    >
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Platform */}
            <div className="text-center sm:text-left">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{
                  fontFamily: "var(--font-data)",
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                Platform
              </p>
              <ul className="mt-5 space-y-2.5">
                {data.platform.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className="text-sm transition-colors duration-150"
                      style={{ color: "rgba(255,255,255,0.32)" }}
                    >
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="text-center sm:text-left">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{
                  fontFamily: "var(--font-data)",
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                Legal
              </p>
              <ul className="mt-5 space-y-2.5">
                {data.legal.map(({ text, href }) => (
                  <li key={text}>
                    <Link
                      href={href}
                      className="text-sm transition-colors duration-150"
                      style={{ color: "rgba(255,255,255,0.32)" }}
                    >
                      {text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="text-center sm:text-left">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{
                  fontFamily: "var(--font-data)",
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                Contact
              </p>
              <ul className="mt-5 space-y-3">
                {data.contact.map(({ icon: Icon, text, href }) => (
                  <li key={text}>
                    {href ? (
                      <Link href={href} className="flex items-start gap-2">
                        <Icon
                          className="h-3.5 w-3.5 mt-0.5 shrink-0"
                          style={{ color: "rgba(180,60,60,0.55)" }}
                        />
                        <span
                          className="text-sm leading-snug"
                          style={{ color: "rgba(255,255,255,0.30)" }}
                        >
                          {text}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-2">
                        <Icon
                          className="h-3.5 w-3.5 mt-0.5 shrink-0"
                          style={{ color: "rgba(180,60,60,0.55)" }}
                        />
                        <span
                          className="text-sm leading-snug"
                          style={{ color: "rgba(255,255,255,0.30)" }}
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

        {/* Bottom bar */}
        <div
          className="mt-14 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}
        >
          <p
            className="text-xs text-center sm:text-left"
            style={{ color: "rgba(255,255,255,0.16)" }}
          >
            &copy; {new Date().getFullYear()}{" "}
            <span style={{ color: "rgba(255,255,255,0.32)" }}>
              C3 Esports
            </span>
            . All rights reserved.
          </p>
          <p
            className="text-xs text-center sm:text-right"
            style={{ color: "rgba(255,255,255,0.10)" }}
          >
            Built for collegiate competitors.
          </p>
        </div>
      </div>
    </footer>
  )
}
