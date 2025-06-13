"use client"

import { BottomNav, collectorNavItems, recyclerNavItems } from "@/components/dashboard/bottom-nav"
import { Header } from "@/components/dashboard/header"
import { usePathname } from "next/navigation"
import { useAccount } from "wagmi"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useEffect, useState } from "react"
import { useRole } from "@/hooks/use-role"

interface UserProfile {
  name: string;
  location: string;
  contactInfo: string;
  role: string;
  status: number;
  registrationDate: bigint;
  isVerified: boolean;
  verificationDate: bigint;
  totalCollected: bigint;
  totalEarnings: bigint;
  collectorReputationScore: bigint;
}

interface DashboardShellProps {
  children?: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const { role, isLoading } = useRole()
  const isCollector = role === "collector"
  const isRecycler = role === "recycler"

  const { address } = useAccount()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const africycle = useAfriCycle({
    contractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL as string,
  })

  useEffect(() => {
    async function loadUserProfile() {
      if (!address || !africycle) {
        return
      }

      try {
        const profile = await africycle.getUserProfile(address)
        const mappedProfile: UserProfile = {
          name: profile.name,
          location: profile.location,
          contactInfo: profile.contactInfo,
          role: profile.role,
          status: profile.status,
          registrationDate: profile.registrationDate,
          isVerified: profile.isVerified,
          verificationDate: profile.verificationDate,
          totalCollected: profile.totalCollected,
          totalEarnings: profile.totalEarnings,
          collectorReputationScore: profile.collectorReputationScore,
        }
        setUserProfile(mappedProfile)
      } catch (error) {
        console.error("Error loading user profile:", error)
      }
    }

    loadUserProfile()
  }, [address, africycle])

  // Add debugging
  useEffect(() => {
    console.log("DashboardShell - Role:", role)
    console.log("DashboardShell - Loading:", isLoading)
    console.log("DashboardShell - User Profile:", userProfile)
  }, [role, isLoading, userProfile])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {!isLoading && role && (
        <Header 
          role={role as "collector" | "recycler"}
          name={userProfile?.name || "Not Registered"}
        />
      )}

      {/* Main Content */}
      <main className="container mx-auto max-w-5xl px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isLoading && role && (
        <BottomNav 
          items={
            isCollector ? collectorNavItems :
            isRecycler ? recyclerNavItems :
            []
          } 
        />
      )}
    </div>
  )
} 