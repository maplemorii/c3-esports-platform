import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { HeroSection } from "@/components/home/hero-section"
import { MarqueeSection } from "@/components/home/marquee-section"
import { GamesSection } from "@/components/home/games-section"
import { StatsSection } from "@/components/home/stats-section"
import { FeaturesSection } from "@/components/home/features-section"
import { HowItWorksSection } from "@/components/home/how-it-works-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { CTASection } from "@/components/home/cta-section"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <div className="flex flex-col">
      <HeroSection isSignedIn={false} />
      <MarqueeSection />
      <GamesSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection isSignedIn={false} />
    </div>
  )
}
