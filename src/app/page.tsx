import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { HeroSection } from "@/components/home/hero-section"
import { MarqueeSection } from "@/components/home/marquee-section"
import { StatsSection } from "@/components/home/stats-section"
import { DivisionsSection } from "@/components/home/divisions-section"
import { FeaturesSection } from "@/components/home/features-section"
import { HowItWorksSection } from "@/components/home/how-it-works-section"
import { CTASection } from "@/components/home/cta-section"
import { GamesSection } from "@/components/home/games-section"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <div className="flex flex-col">
      <HeroSection isSignedIn={false} />
      <MarqueeSection />
      <GamesSection />
      <StatsSection />
      <DivisionsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection isSignedIn={false} />
    </div>
  )
}
