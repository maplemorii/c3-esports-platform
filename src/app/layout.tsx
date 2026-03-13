import type { Metadata } from "next"
import { Inter, Rajdhani, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Providers } from "@/components/providers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/* Display / headings — condensed bold, esports feel */
const rajdhani = Rajdhani({
  weight: ["400", "500", "600", "700"],
  variable: "--font-rajdhani",
  subsets: ["latin"],
})

/* Body text — clean, readable at small sizes */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

/* Editorial accent — italic serif for hero typography contrast */
const playfair = Playfair_Display({
  weight: ["400"],
  style: ["italic"],
  variable: "--font-playfair",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "C3 Esports League",
    template: "%s | C3 Esports League",
  },
  description: "The premier collegiate Rocket League platform in the Carolinas.",
  openGraph: {
    siteName: "C3 Esports League",
    type: "website",
    locale: "en_US",
    title: {
      default: "C3 Esports League",
      template: "%s | C3 Esports League",
    },
    description: "The premier collegiate Rocket League platform in the Carolinas.",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "C3 Esports League",
      template: "%s | C3 Esports League",
    },
    description: "The premier collegiate Rocket League platform in the Carolinas.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className="dark">
      <body
        className={`${rajdhani.variable} ${inter.variable} ${playfair.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <Providers session={session}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
