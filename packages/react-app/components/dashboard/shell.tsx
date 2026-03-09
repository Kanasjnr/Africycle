"use client"

import { BottomNav, collectorNavItems, recyclerNavItems } from "@/components/dashboard/bottom-nav"
import { Header } from "@/components/dashboard/header"
import { usePathname } from "next/navigation"
import { useAccount } from "wagmi"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useEffect, useState } from "react"
import { useRole } from "@/providers/RoleProvider"

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
  const { address, isConnected } = useAccount()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  const [profileLoading, setProfileLoading] = useState(true)

  const africycle = useAfriCycle({
    contractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL as string,
  })

  useEffect(() => {
    async function loadUserProfile() {
      if (!address || !africycle) {
        setProfileLoading(false)
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
      } finally {
        setProfileLoading(false)
      }
    }

    loadUserProfile()
  }, [address, africycle])


  const inferRoleFromPath = (): 'collector' | 'recycler' | null => {
    if (pathname.includes('/dashboard/collector')) return 'collector'
    if (pathname.includes('/dashboard/recycler')) return 'recycler'
    return null
  }

  const effectiveRole = role || inferRoleFromPath()

  const shouldShowNavigation = (isConnected && effectiveRole && !isLoading) ||
    (pathname.startsWith('/dashboard') && effectiveRole)

  const getNavigationItems = () => {
    if (!effectiveRole) return []

    switch (effectiveRole) {
      case 'collector':
        return collectorNavItems
      case 'recycler':
        return recyclerNavItems
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {!isLoading && effectiveRole && (
        <Header
          heading="Dashboard"
          text="Welcome to your dashboard"
          role={effectiveRole as "collector" | "recycler"}
          name={profileLoading ? "..." : (userProfile?.name || "Welcome")}
        />
      )}

      {/* Main Content */}
      <main className="w-full px-4 py-6 pb-24 pt-8">
        {children}
      </main>

      {/* Bottom Navigation - Improved Logic */}
      {shouldShowNavigation && (
        <BottomNav
          items={getNavigationItems()}
        />
      )}
    </div>
  )
} 