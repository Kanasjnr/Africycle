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
import { RegistrationDialog } from "@/components/dialogs/registration-dialog"
import { useAccount } from "wagmi"
import { useRole, type Role } from "@/providers/RoleProvider"
import { useAfriCycle } from "@/hooks/useAfricycle"

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL

if (!CONTRACT_ADDRESS || !RPC_URL) {
  throw new Error("Missing required environment variables: NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS or NEXT_PUBLIC_CELO_RPC_URL")
}

// Type assertion after validation
const CONTRACT_ADDRESS_SAFE = CONTRACT_ADDRESS as `0x${string}`
const RPC_URL_SAFE = RPC_URL as string

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [isCheckingBlockchain, setIsCheckingBlockchain] = useState(true)
  const [isRegisteredOnBlockchain, setIsRegisteredOnBlockchain] = useState(false)
  const { isConnected } = useAccount()
  const { role, isLoading } = useRole()
  const { address } = useAccount()

  // Initialize AfriCycle hook unconditionally
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS_SAFE,
    rpcUrl: RPC_URL_SAFE,
  })

  // Check blockchain registration status
  useEffect(() => {
    async function checkBlockchainRegistration() {
      // Only proceed if wallet is connected and we have an address
      if (!isConnected || !address || !africycle) {
        setIsCheckingBlockchain(false)
        setIsRegisteredOnBlockchain(false)
        return
      }

      try {
        const blockchainRole = await africycle.getUserRole(address)
        // A zero bytes32 value (all zeros) means the user is not registered
        const isZeroRole = blockchainRole === "0x0000000000000000000000000000000000000000000000000000000000000000"
        setIsRegisteredOnBlockchain(!isZeroRole)
        
        console.log("Blockchain role check:", {
          address,
          blockchainRole,
          isZeroRole,
          isRegistered: !isZeroRole
        })
      } catch (error) {
        console.error("Error checking blockchain registration:", error)
        setIsRegisteredOnBlockchain(false)
      } finally {
        setIsCheckingBlockchain(false)
      }
    }

    checkBlockchainRegistration()
  }, [isConnected, address, africycle])

  // Determine if we should show the registration dialog
  const showRegistration = isConnected && !isLoading && !isCheckingBlockchain && !isRegisteredOnBlockchain && !!africycle

  console.log("HomePage state:", {
    isConnected,
    role,
    isLoading,
    isCheckingBlockchain,
    isRegisteredOnBlockchain,
    showRegistration,
    isMounted,
    showSplash
  })

  useEffect(() => {
    console.log("HomePage mounted")
    setIsMounted(true)
    // Increase splash screen duration to 5 seconds
    const timer = setTimeout(() => {
      console.log("Splash screen timeout completed")
      setShowSplash(false)
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [])

  // Log when registration dialog visibility changes
  useEffect(() => {
    console.log("Registration dialog visibility changed:", showRegistration)
  }, [showRegistration])

  // Handle splash screen completion
  const handleSplashComplete = () => {
    console.log("Splash screen completed manually")
    setShowSplash(false)
  }

  // Return null during SSR to prevent hydration mismatch
  if (typeof window === 'undefined') {
    console.log("Rendering during SSR")
    return null
  }

  // Return null while mounting to prevent hydration mismatch
  if (!isMounted) {
    console.log("Component not mounted yet")
    return null
  }

  return (
    <>
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
    </>
  )
}

