"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import Hero from "@/components/sections/hero"
import Features from "@/components/sections/features"
import WasteStreams from "@/components/sections/WasteStreams"
import HowItWorks from "@/components/sections/HowItWorks"
import Stakeholders from "@/components/sections/Stakeholders"
import Stats from "@/components/sections/Stats"
import CTA from "@/components/sections/CTA"
import SplashScreen from "@/components/SplashScreen"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/footer"
import { AppProvider } from "@/providers/AppProvider"
import { RegistrationDialog } from "@/components/dialogs/registration-dialog"
import { useAccount } from "wagmi"
import { useRole } from "@/providers/RoleProvider"

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const { isConnected } = useAccount()
  const { role, isLoading } = useRole()

  // Determine if we should show the registration dialog
  const showRegistration = isConnected && !isLoading && !role

  useEffect(() => {
    setIsMounted(true)
    // Increase splash screen duration to 5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [])

  // Handle splash screen completion
  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  // Return null during SSR to prevent hydration mismatch
  if (typeof window === 'undefined') {
    return null
  }

  // Return null while mounting to prevent hydration mismatch
  if (!isMounted) {
    return null
  }

  return (
    <AppProvider>
      <AnimatePresence mode="wait">
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      <div className={`min-h-screen flex flex-col ${showSplash ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}>
        <Navbar />
        <main className="flex-grow overflow-hidden">
          <Hero />
          <Features />
          <WasteStreams />
          <HowItWorks />
          <Stakeholders />
          <Stats />
          <CTA />
        </main>
        <Footer />

        {/* Only show registration dialog when needed */}
        {showRegistration && <RegistrationDialog />}
      </div>
    </AppProvider>
  )
}

