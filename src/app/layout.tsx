import type { Metadata } from "next"
import { Outfit, Space_Grotesk, Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Providers } from "@/components/providers"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/* Body — clean, modern sans */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

/* Mono — data, stats, codes */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

/* Display / headings — geometric, bold, distinctive */
const outfit = Outfit({
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  subsets: ["latin"],
})

/* Data accent — for stats displays */
const spacegrotesk = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: {
    default: "C3 Esports League",
    template: "%s | C3 Esports League",
  },
  description: "The premier collegiate esports platform in the Carolinas.",
  openGraph: {
    siteName: "C3 Esports League",
    type: "website",
    locale: "en_US",
    title: {
      default: "C3 Esports League",
      template: "%s | C3 Esports League",
    },
    description: "The premier collegiate esports platform in the Carolinas.",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "C3 Esports League",
      template: "%s | C3 Esports League",
    },
    description: "The premier collegiate esports platform in the Carolinas.",
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
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${spacegrotesk.variable} font-sans antialiased min-h-screen flex flex-col`}
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
