"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/dashboard/header"
import { Loader } from "@/components/ui/loader"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useAccount, usePublicClient } from "wagmi"
import { useEffect, useState } from "react"
import { AfricycleStatus, AfricycleWasteStream } from "@/hooks/useAfricycle"
import { 
  IconPackage, 
  IconRecycle, 
  IconCoin, 
  IconChartBar, 
  IconTruck, 
  IconUsers, 
  IconCalendar,
  IconUpload,
  IconGift
} from "@tabler/icons-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Utility function to format wei to cUSD
function formatCUSD(weiValue: bigint): string {
  const divisor = BigInt(10 ** 18) // 18 decimal places for cUSD
  const cUSDValue = Number(weiValue) / Number(divisor)
  return cUSDValue.toFixed(3) // Show 3 decimal places
}

// G$ contract addresses (Celo mainnet)
const G_DOLLAR_TOKEN_ADDRESS = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A" as `0x${string}`
const UBI_SCHEME_PROXY_ADDRESS = "0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1" as `0x${string}`

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, description, icon, color }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-3 ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-1 text-2xl font-bold">{value}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  )
}

interface ProgressCardProps {
  title: string
  value: number
  total: number
  description: string
  color: string
}

function ProgressCard({ title, value, total, description, color }: ProgressCardProps) {
  const percentage = (value / total) * 100
  return (
    <Card className="p-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className="text-sm font-medium">{value}/{total}</span>
        </div>
        <Progress value={percentage} className={`h-2 ${color}`} />
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  )
}

export default function CollectorDashboard() {
  const { address } = useAccount()
  const router = useRouter()
  const publicClient = usePublicClient()
  const africycle = useAfriCycle({
    contractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
  })

  const [stats, setStats] = useState({
    totalCollected: BigInt(0),
    totalEarnings: BigInt(0),
    scheduledPickups: BigInt(0),
    collectedByType: [BigInt(0), BigInt(0), BigInt(0), BigInt(0)] as [bigint, bigint, bigint, bigint],
    reputationScore: BigInt(0),
    verifiedStatus: false
  })

  const [isLoading, setIsLoading] = useState(true)
  const [gDollarStats, setGDollarStats] = useState({
    totalClaimed: 0,
    claimCount: 0
  })

  // Load G$ statistics from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && address) {
      const savedStats = localStorage.getItem(`gDollarStats_${address}`)
      if (savedStats) {
        try {
          const { totalClaimed, claimCount } = JSON.parse(savedStats)
          setGDollarStats({
            totalClaimed: totalClaimed || 0,
            claimCount: claimCount || 0
          })
        } catch (error) {
          console.error('Error loading G$ stats from localStorage:', error)
        }
      }
    }
  }, [address])

  // Fetch actual G$ claim history from blockchain  
  useEffect(() => {
    async function fetchGDollarClaimHistory() {
      if (!address || !publicClient) return

      try {
        console.log('🔵 Dashboard G$ History: Fetching real claim history...')
        
        // Calculate starting block (approximately 6 months ago to avoid timeout)
        // Celo has ~5 second block times, so 6 months ≈ 180 days * 24 hours * 60 minutes * 12 blocks/minute
        const currentBlock = await publicClient.getBlockNumber()
        const blocksPerDay = (24 * 60 * 60) / 5 // 5 second block time
        const sixMonthsAgo = currentBlock - BigInt(Math.floor(blocksPerDay * 180))
        
        console.log('📊 Dashboard G$ History: Querying from block', sixMonthsAgo.toString(), 'to current block')
        
        // Query Transfer events from UBI Scheme Proxy to user's address (last 6 months)
        const logs = await publicClient.getLogs({
          address: G_DOLLAR_TOKEN_ADDRESS,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { name: 'from', type: 'address', indexed: true },
              { name: 'to', type: 'address', indexed: true },
              { name: 'value', type: 'uint256', indexed: false }
            ]
          },
          args: {
            from: UBI_SCHEME_PROXY_ADDRESS,
            to: address
          },
          fromBlock: sixMonthsAgo,
          toBlock: currentBlock
        })

        console.log('📊 Dashboard G$ History: Found', logs.length, 'G$ claim transactions in last 6 months')

        let totalClaimed = 0
        let claimCount = logs.length

        // Calculate total claimed amount
        for (const log of logs) {
          const amount = Number(log.args.value as bigint) / 1e18  // Convert wei to G$
          totalClaimed += amount
        }

        console.log('✅ Dashboard G$ History: Total claimed (last 6 months):', totalClaimed.toFixed(6), 'G$ across', claimCount, 'claims')

        // Update state with real blockchain data
        setGDollarStats({
          totalClaimed: totalClaimed,
          claimCount: claimCount
        })

        // Update localStorage with real data
        if (typeof window !== 'undefined') {
          const stats = {
            totalClaimed: totalClaimed,
            claimCount: claimCount
          }
          localStorage.setItem(`gDollarStats_${address}`, JSON.stringify(stats))
        }

      } catch (error) {
        console.error('❌ Dashboard G$ History: Failed to fetch G$ claim history:', error)
        
        // If it's a timeout, don't show error as this is normal for new accounts
        if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('took too long'))) {
          console.log('⚠️ Dashboard G$ History: Query timed out, this is normal for accounts with no recent G$ claims')
        }
        
        // Keep existing localStorage data if blockchain query fails
        if (typeof window !== 'undefined' && address) {
          const savedStats = localStorage.getItem(`gDollarStats_${address}`)
          if (savedStats) {
            try {
              const { totalClaimed, claimCount } = JSON.parse(savedStats)
              setGDollarStats({
                totalClaimed: totalClaimed || 0,
                claimCount: claimCount || 0
              })
              console.log('📱 Dashboard G$ History: Using localStorage data:', { totalClaimed, claimCount })
            } catch (parseError) {
              console.error('Error parsing localStorage G$ stats:', parseError)
            }
          }
        }
      }
    }

    // Only fetch after we have the necessary dependencies
    if (address && publicClient) {
      fetchGDollarClaimHistory()
    }
  }, [address, publicClient])  // Run when address or publicClient changes

  useEffect(() => {
    async function fetchStats() {
      if (!africycle || !address) return

      try {
        setIsLoading(true)
        const profile = await africycle.getUserProfile(address)
        
        setStats({
          totalCollected: profile.totalCollected,
          totalEarnings: profile.totalEarnings,
          scheduledPickups: profile.scheduledPickups,
          collectedByType: profile.collectedByType,
          reputationScore: profile.collectorReputationScore,
          verifiedStatus: profile.isVerified
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
        toast.error("Failed to fetch dashboard statistics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [africycle, address])

  const totalCollected = stats.collectedByType.reduce((sum, val) => sum + val, BigInt(0))

  const handleCreateCollection = () => {
    router.push("/dashboard/collector/verification")
  }

  const handleSchedulePickup = () => {
    router.push("/dashboard/collector/map")
  }

  const handleTrackPickups = () => {
    router.push("/dashboard/collector/map")
    toast.info("Track your scheduled pickups on the map")
  }

  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <Loader 
            message="Loading dashboard statistics..." 
            size="lg"
            className="py-16"
          />
        ) : (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
              <StatCard
                title="Total Collected"
                value={`${totalCollected.toString()} kg`}
                description="Total waste collected"
                icon={<IconPackage className="h-6 w-6 text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Total Earnings"
                value={`${formatCUSD(stats.totalEarnings)} cUSD`}
                description="Total earnings from collections"
                icon={<IconCoin className="h-6 w-6 text-white" />}
                color="bg-green-500"
              />
              <StatCard
                title="G$ UBI Claimed"
                value={`${gDollarStats.totalClaimed.toFixed(2)} G$`}
                description={`${gDollarStats.claimCount} claims made`}
                icon={<IconGift className="h-6 w-6 text-white" />}
                color="bg-purple-500"
              />
              <StatCard
                title="Reputation Score"
                value={stats.reputationScore.toString()}
                description="Your collector reputation"
                icon={<IconChartBar className="h-6 w-6 text-white" />}
                color="bg-yellow-500"
              />
            </div>

            {/* Waste Type Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold">Collection Distribution</h3>
              <p className="text-sm text-muted-foreground mb-4">Total waste collected by type</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                {Object.values(AfricycleWasteStream)
                  .filter(value => typeof value === 'number')
                  .map((wasteType) => (
                    <div key={wasteType} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <IconRecycle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {wasteType === AfricycleWasteStream.PLASTIC ? "Plastic" :
                           wasteType === AfricycleWasteStream.EWASTE ? "E-Waste" :
                           wasteType === AfricycleWasteStream.METAL ? "Metal" : "General"}
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold">
                        {stats.collectedByType[Number(wasteType)].toString()} kg
                      </p>
                      <Progress 
                        value={Number(stats.collectedByType[Number(wasteType)]) / Number(totalCollected) * 100} 
                        className="mt-2 h-2" 
                      />
                    </div>
                  ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 xl:grid-cols-3">
              <Button className="h-auto p-6" variant="outline" onClick={handleCreateCollection}>
                <div className="flex items-center gap-4">
                  <IconUpload className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-medium">Create Collection</p>
                    <p className="text-sm text-muted-foreground">Create a new waste collection</p>
                  </div>
                </div>
              </Button>
              <Button className="h-auto p-6" variant="outline" onClick={handleSchedulePickup}>
                <div className="flex items-center gap-4">
                  <IconCalendar className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-medium">Schedule Pickup</p>
                    <p className="text-sm text-muted-foreground">Schedule a new waste pickup</p>
                  </div>
                </div>
              </Button>
              <Button className="h-auto p-6" variant="outline" onClick={handleTrackPickups}>
                <div className="flex items-center gap-4">
                  <IconTruck className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-medium">Track Pickups</p>
                    <p className="text-sm text-muted-foreground">View pickup status and history</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}