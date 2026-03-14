import Link from "next/link"
import Image from "next/image"

const LINKS = {
  League: [
    { href: "/seasons", label: "Seasons" },
    { href: "/teams", label: "Teams" },
    { href: "/rules", label: "Rules" },
  ],
  Platform: [
    { href: "/auth/register", label: "Register" },
    { href: "/auth/signin", label: "Sign In" },
    { href: "/docs", label: "Docs" },
    { href: "/support", label: "Support" },
    { href: "/credits", label: "Credits" },
  ],
  Legal: [
    { href: "/legal/terms", label: "Terms of Service" },
    { href: "/legal/privacy", label: "Privacy Policy" },
  ],
}

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(59,130,246,0.12)",
        background: "oklch(0.10 0.02 265)",
      }}
    >
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand block */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center mb-4" aria-label="C3 Esports — home">
              <Image
                src="/logo.png"
                alt="C3 Esports"
                width={200}
                height={48}
                style={{ height: "26px", width: "auto", opacity: 0.75 }}
              />
            </Link>
            <p
              className="font-sans text-sm leading-relaxed max-w-[22ch]"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              The premier Rocket League league for collegiate players across the Carolinas.
            </p>

            {/* Decorative line */}
            <div
              className="mt-8 h-px w-24"
              style={{
                background:
                  "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)",
              }}
              aria-hidden
            />
          </div>

          {/* Nav columns */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <h4
                className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] mb-5"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                {category}
              </h4>
              <nav className="flex flex-col gap-3">
                {links.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="font-sans text-sm text-white/40 hover:text-blue-300/80 transition-colors duration-150"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="mt-16 pt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p
            className="font-sans text-xs"
            style={{ color: "rgba(255,255,255,0.22)" }}
          >
            &copy; {new Date().getFullYear()}{" "}
            <span style={{ color: "rgba(255,255,255,0.45)" }}>C3 Esports</span>
            . All rights reserved.
          </p>
          <p
            className="font-sans text-xs"
            style={{ color: "rgba(255,255,255,0.14)" }}
          >
            Built for collegiate competitors.
          </p>
        </div>
      </div>
    </footer>
  )
}
