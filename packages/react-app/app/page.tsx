"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Simple loading placeholders
const LoadingPlaceholder = () => <div className="min-h-screen bg-black" />
const NavPlaceholder = () => <div className="h-16" />
const FooterPlaceholder = () => <div className="h-96 bg-black" />

// Use dynamic imports with no SSR to prevent hydration issues
const PreLoader = dynamic(() => import("@/components/preloader"), {
  ssr: false,
  loading: () => <LoadingPlaceholder />,
})

const FloatingNavbar = dynamic(() => import("@/components/FloatingNavbar"), {
  ssr: false,
  loading: () => <NavPlaceholder />,
})

const ImmersiveHero = dynamic(() => import("@/components/sections/ImmersiveHero"), {
  ssr: false,
  loading: () => <LoadingPlaceholder />,
})

const ImpactSection = dynamic(() => import("@/components/sections/ImpactSection"), {
  ssr: false,
  loading: () => <LoadingPlaceholder />,
})

const ProcessFlow = dynamic(() => import("@/components/sections/ProcessFlow"), {
  ssr: false,
  loading: () => <LoadingPlaceholder />,
})

const EcosystemSection = dynamic(() => import("@/components/sections/EcosystemSection"), {
  ssr: false,
  loading: () => <LoadingPlaceholder />,
})

const JoinMovement = dynamic(() => import("@/components/sections/JoinMovement"), {
  ssr: false,
  loading: () => <LoadingPlaceholder />,
})

const Footer = dynamic(() => import("@/components/AnimatedFooter"), {
  ssr: false,
  loading: () => <FooterPlaceholder />,
})

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Add a slight delay to ensure all components are properly loaded
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Don't render anything during SSR
  if (!mounted) {
    return null
  }

  // Show preloader during initial loading phase
  if (loading) {
    return <PreLoader onFinish={() => setLoading(false)} />
  }

  return (
    <main className="relative">
      <FloatingNavbar />
      <ImmersiveHero />
      <ImpactSection />
      <ProcessFlow />
      <EcosystemSection />
      <JoinMovement />
      <Footer />
    </main>
  )
}

