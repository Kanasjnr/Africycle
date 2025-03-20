"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import Hero from "@/components/sections/hero"
import Features from "@/components/sections/features"
import WasteStreams from "@/components/sections/WasteStreams"
import HowItWorks from "@/components/sections/HowItWorks"
import Stakeholders from "@/components/sections/Stakeholders"
import Stats from "@/components/sections/Stats"
import CTA from "@/components/sections/CTA"
import SplashScreen from "@/components/SplashScreen"

export default function ClientPage() {
  const [showSplash, setShowSplash] = useState(true)

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  return (
    <>
      <AnimatePresence>{showSplash && <SplashScreen onComplete={handleSplashComplete} />}</AnimatePresence>

      <main className={`overflow-hidden transition-opacity duration-500 ${showSplash ? "opacity-0" : "opacity-100"}`}>
        <Hero />
        <Features />
        <WasteStreams />
        <HowItWorks />
        <Stakeholders />
        <Stats />
        <CTA />
      </main>
    </>
  )
}

