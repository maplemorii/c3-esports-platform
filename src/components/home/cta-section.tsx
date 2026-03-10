"use client"

import { motion } from "framer-motion"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

interface CTASectionProps {
  isSignedIn: boolean
}

export function CTASection({ isSignedIn }: CTASectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-border px-4 py-32 text-center">
      {/* Background texture */}
      <div className="hero-stripes absolute inset-0 opacity-35" />
      <div className="absolute inset-0 bg-linear-to-b from-card/80 to-background/80" />

      {/* Animated glow */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[640px] rounded-full bg-brand/12 blur-[130px] pointer-events-none"
        animate={{ scale: [1, 1.18, 1], opacity: [0.1, 0.22, 0.1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-2xl flex flex-col items-center gap-7">
        <motion.h2
          className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl lg:text-6xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          Ready to{" "}
          <span className="text-brand [text-shadow:0_0_60px_oklch(0.50_0.20_15/50%)]">
            Compete?
          </span>
        </motion.h2>

        <motion.p
          className="text-base text-muted-foreground sm:text-lg max-w-md"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
        >
          Registration is open. Form your squad, pick your school, and sign up before
          spots fill up.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
        >
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ size: "lg" }),
                "px-10 shadow-[0_0_24px_oklch(0.50_0.20_15/30%)] hover:shadow-[0_0_44px_oklch(0.50_0.20_15/55%)] transition-all duration-300"
              )}
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "px-10 gap-2 shadow-[0_0_24px_oklch(0.50_0.20_15/30%)] hover:shadow-[0_0_44px_oklch(0.50_0.20_15/55%)] transition-all duration-300"
                )}
              >
                Create an Account
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/signin"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "px-10")}
              >
                Sign In
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}
