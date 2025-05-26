"use client"

import { Nav, recyclerNavItems, collectorNavItems, collectionPointNavItems, corporatePartnerNavItems } from "@/components/dashboard/nav"
import { IconBell, IconMoon } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  const isCollectionPoint = role === "collection_point"
  const isCorporatePartner = role === "corporate_partner"
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
          name: profile.location,
          location: profile.contactInfo,
          contactInfo: profile.name,
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

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex min-h-screen">
      {/* Only show sidebar when role is loaded and valid */}
      {!isLoading && role && (
        <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
          <div className="flex h-full flex-col border-r bg-white">
            <div className="flex flex-col gap-4 px-6 py-4">
              {/* Logo */}
              <div className="flex items-center gap-2 py-2">
                <div className="rounded-full bg-gray-900 p-1">
                  <div className="h-6 w-6 rounded-full bg-white" />
                </div>
                <span className="text-lg font-semibold">
                  {isCollector ? "Collector" :
                   isRecycler ? "Recycler" :
                   isCollectionPoint ? "Collection Point" :
                   isCorporatePartner ? "Corporate Partner" : "Dashboard"}
                </span>
              </div>

              {/* Navigation */}
              <Nav items={
                isCollector ? collectorNavItems :
                isRecycler ? recyclerNavItems :
                isCollectionPoint ? collectionPointNavItems :
                isCorporatePartner ? corporatePartnerNavItems :
                []
              } />
            </div>

            {/* User Profile */}
            <div className="mt-auto border-t p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  {userProfile?.name ? (
                    <span className="text-sm font-medium text-primary">
                      {getInitials(userProfile.name)}
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-primary">
                      {address?.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">
                    {userProfile?.name || "Not Registered"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {userProfile?.location || "No location set"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 pl-0 lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <IconBell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <IconMoon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 space-y-4 p-8 pt-6">{children}</main>
      </div>
    </div>
  )
} 