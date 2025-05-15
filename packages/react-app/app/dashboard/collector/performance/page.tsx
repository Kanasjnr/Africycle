"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  IconTrendingUp,
  IconScale,
  IconClock,
  IconStar,
  IconAward,
  IconUsers,
} from "@tabler/icons-react"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || ""

interface RankingProps {
  rank: number
  name: string
  score: number
  isCurrentUser?: boolean
}

function RankingItem({ rank, name, score, isCurrentUser }: RankingProps) {
  return (
    <div
      className={`flex items-center justify-between border-b py-4 last:border-0 ${
        isCurrentUser ? "bg-muted/50 -mx-6 px-6" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <span className="text-sm font-medium">#{rank}</span>
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            {score.toLocaleString()} points
          </p>
        </div>
      </div>
      {isCurrentUser && <Badge>You</Badge>}
    </div>
  )
}

interface PerformanceMetricProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: string
}

function PerformanceMetric({
  title,
  value,
  description,
  icon,
  trend,
}: PerformanceMetricProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {icon}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              {trend && <Badge variant="secondary">{trend}</Badge>}
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function PerformanceStatsPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [rankings, setRankings] = useState<any[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  
  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })
  
  useEffect(() => {
    async function fetchPerformanceData() {
      if (!address || !africycle) return
      
      try {
        setLoading(true)
        
        // Fetch collector stats
        const stats = await africycle.getCollectorStats(address)
        
        // Get total number of collectors
        const contractStats = await africycle.getContractStats()
        const totalCollectors = Number(contractStats.collectedStats[0]) || 0
        
        // Fetch collectors for ranking
        const collectors = []
        const mockNames = ["Sarah Kamau", "David Omondi", "Lucy Wanjiku", "John Doe", "Peter Maina"]
        
        // In a real app, we would fetch actual collector data and sort by performance
        // For now, we'll create mock data based on the contract stats
        for (let i = 0; i < Math.min(totalCollectors, 5); i++) {
          try {
            // This is a simplified approach - in a real app, you would fetch actual collector data
            const mockScore = Math.floor(Math.random() * 1000) + 2000
            collectors.push({
              id: i,
              name: mockNames[i] || `Collector ${i}`,
              score: mockScore,
              isCurrentUser: i === 3 // Mock current user for demo
            })
          } catch (error) {
            console.error(`Error fetching collector ${i}:`, error)
          }
        }
        
        // Sort by score
        collectors.sort((a, b) => b.score - a.score)
        
        // Find user's rank
        const userRankIndex = collectors.findIndex(c => c.isCurrentUser)
        
        // Calculate performance metrics
        const performanceData = {
          efficiency: 92, // Mock efficiency percentage
          avgCollection: Number(stats.totalCollected) / Math.max(1, Number(stats.verifiedCollections)),
          responseTime: 25, // Mock response time
          rating: 4.8, // Mock rating
          
          // Progress metrics
          collectionTarget: {
            current: Number(stats.totalCollected),
            target: 300, // Mock target
          },
          verificationRate: {
            successful: Number(stats.verifiedCollections),
            total: Number(stats.verifiedCollections) + Number(stats.pendingVerifications),
          },
          onTimeRate: {
            onTime: 29, // Mock on-time collections
            total: 31, // Mock total collections
          }
        }
        
        setPerformanceData(performanceData)
        setRankings(collectors)
        setUserRank(userRankIndex !== -1 ? userRankIndex + 1 : null)
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching performance data:", error)
        setLoading(false)
      }
    }
    
    fetchPerformanceData()
  }, [address, africycle])
  
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Performance Stats"
        text="Track your collection performance and rankings"
      />
      <div className="grid gap-6">
        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            // Loading skeletons
            Array(4).fill(0).map((_, i) => (
              <Card key={i}>
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-8 w-20 mb-2" />
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <>
              <PerformanceMetric
                icon={<IconTrendingUp className="h-6 w-6 text-primary" />}
                title="Collection Efficiency"
                value={`${performanceData.efficiency}%`}
                description="Average collection completion rate"
                trend="+5% this month"
              />
              <PerformanceMetric
                icon={<IconScale className="h-6 w-6 text-primary" />}
                title="Average Collection"
                value={`${performanceData.avgCollection.toFixed(1)} kg`}
                description="Average weight per collection"
                trend="+1.2 kg this month"
              />
              <PerformanceMetric
                icon={<IconClock className="h-6 w-6 text-primary" />}
                title="Response Time"
                value={`${performanceData.responseTime} min`}
                description="Average time to reach collection point"
                trend="-5 min this month"
              />
              <PerformanceMetric
                icon={<IconStar className="h-6 w-6 text-primary" />}
                title="Rating"
                value={`${performanceData.rating}/5.0`}
                description="Average rating from recyclers"
                trend="+0.2 this month"
              />
            </>
          )}
        </div>

        {/* Collector Rankings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Top Collectors</h2>
                <p className="text-sm text-muted-foreground">
                  Rankings based on collection performance
                </p>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <IconAward className="h-4 w-4" />
                  Rank #{userRank || "?"}
                </Badge>
              )}
            </div>
            <div className="mt-6">
              {loading ? (
                // Loading skeletons
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="py-4 border-b last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                ))
              ) : (
                rankings.map((collector, index) => (
                  <RankingItem
                    key={collector.id}
                    rank={index + 1}
                    name={collector.name}
                    score={collector.score}
                    isCurrentUser={collector.isCurrentUser}
                  />
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Performance Insights */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Performance Insights</h2>
                <p className="text-sm text-muted-foreground">
                  Key metrics and achievements this month
                </p>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <IconUsers className="h-4 w-4" />
                  Top 10%
                </Badge>
              )}
            </div>
            <div className="mt-6 space-y-6">
              {loading ? (
                // Loading skeletons
                Array(3).fill(0).map((_, i) => (
                  <div key={i}>
                    <div className="mb-2 flex items-center justify-between">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))
              ) : (
                <>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium">Collection Target Progress</h3>
                      <span className="text-sm text-muted-foreground">
                        {performanceData.collectionTarget.current}/{performanceData.collectionTarget.target} kg
                      </span>
                    </div>
                    <Progress value={(performanceData.collectionTarget.current / performanceData.collectionTarget.target) * 100} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {Math.round((performanceData.collectionTarget.current / performanceData.collectionTarget.target) * 100)}% of monthly target achieved
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium">Verification Success Rate</h3>
                      <span className="text-sm text-muted-foreground">
                        {performanceData.verificationRate.successful}/{performanceData.verificationRate.total} collections
                      </span>
                    </div>
                    <Progress value={(performanceData.verificationRate.successful / Math.max(1, performanceData.verificationRate.total)) * 100} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {Math.round((performanceData.verificationRate.successful / Math.max(1, performanceData.verificationRate.total)) * 100)}% verification success rate
                    </p>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-medium">On-Time Collection Rate</h3>
                      <span className="text-sm text-muted-foreground">
                        {performanceData.onTimeRate.onTime}/{performanceData.onTimeRate.total} collections
                      </span>
                    </div>
                    <Progress value={(performanceData.onTimeRate.onTime / performanceData.onTimeRate.total) * 100} />
                    <p className="mt-2 text-sm text-muted-foreground">
                      {Math.round((performanceData.onTimeRate.onTime / performanceData.onTimeRate.total) * 100)}% collections completed on time
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}