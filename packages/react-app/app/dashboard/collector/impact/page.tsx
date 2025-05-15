"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { IconLeaf, IconRecycle, IconTree, IconDroplet } from "@tabler/icons-react"
import { useAfriCycle, AfricycleWasteStream } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"

// Environmental impact conversion factors (simplified estimates)
const IMPACT_FACTORS = {
  CO2_PER_KG: {
    [AfricycleWasteStream.PLASTIC]: 2.5, // kg CO2 saved per kg recycled
    [AfricycleWasteStream.METAL]: 4.0,
    [AfricycleWasteStream.EWASTE]: 5.2,
    [AfricycleWasteStream.GENERAL]: 1.0,
  },
  WATER_PER_KG: {
    [AfricycleWasteStream.PLASTIC]: 17, // liters of water saved per kg recycled
    [AfricycleWasteStream.METAL]: 15,
    [AfricycleWasteStream.EWASTE]: 20,
    [AfricycleWasteStream.GENERAL]: 5,
  },
  TREES_PER_KG: {
    [AfricycleWasteStream.PLASTIC]: 0.03, // equivalent trees saved per kg recycled
    [AfricycleWasteStream.METAL]: 0.02,
    [AfricycleWasteStream.EWASTE]: 0.05,
    [AfricycleWasteStream.GENERAL]: 0.01,
  }
}

// Define type for monthly data
type MonthlyData = {
  [key: string]: {
    month: string;
    waste: number;
    emissions: number;
    water: number;
  }
}

export default function EnvironmentalImpactPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [impactData, setImpactData] = useState<any[]>([])
  const [metrics, setMetrics] = useState({
    totalWaste: 0,
    co2Saved: 0,
    waterSaved: 0,
    treesSaved: 0,
  })
  
  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })
  
  useEffect(() => {
    async function fetchImpactData() {
      if (!address || !africycle) return
      
      try {
        setLoading(true)
        
        // Fetch collector stats
        const stats = await africycle.getCollectorStats(address)
        
        // Get user's collections
        const userCollections = []
        
        // Assuming we can get the total number of collections from the contract
        const totalCollections = await africycle.getContractStats()
        const collectionCount = Number(totalCollections.collectedStats[0]) || 10
        
        // Fetch the most recent collections (up to 20)
        for (let i = collectionCount - 1; i >= Math.max(0, collectionCount - 20); i--) {
          try {
            const collection = await africycle.getCollection(BigInt(i))
            if (collection.collector.toLowerCase() === address.toLowerCase()) {
              // Get collection details
              const details = await africycle.getCollectionDetails(BigInt(i))
              userCollections.push({
                ...collection,
                ...details,
                id: i
              })
            }
          } catch (error) {
            console.error(`Error fetching collection ${i}:`, error)
          }
        }
        
        // Calculate environmental impact
        let totalWaste = 0
        let co2Saved = 0
        let waterSaved = 0
        let treesSaved = 0
        
        // Group collections by month for chart data
        const monthlyData: MonthlyData = {}
        
        userCollections.forEach(collection => {
          const weight = Number(collection.weight)
          const wasteType = collection.wasteType
          
          // Calculate impact based on waste type and weight
          totalWaste += weight
          co2Saved += weight * IMPACT_FACTORS.CO2_PER_KG[wasteType]
          waterSaved += weight * IMPACT_FACTORS.WATER_PER_KG[wasteType]
          treesSaved += weight * IMPACT_FACTORS.TREES_PER_KG[wasteType]
          
          // Group by month for chart
          const date = new Date(Number(collection.timestamp) * 1000)
          const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`
          
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
              month: monthYear,
              waste: 0,
              emissions: 0,
              water: 0
            }
          }
          
          monthlyData[monthYear].waste += weight
          monthlyData[monthYear].emissions += weight * IMPACT_FACTORS.CO2_PER_KG[wasteType]
          monthlyData[monthYear].water += weight * IMPACT_FACTORS.WATER_PER_KG[wasteType]
        })
        
        // Convert monthly data to array and sort by date
        const chartData = Object.values(monthlyData)
        chartData.sort((a: any, b: any) => {
          const dateA = new Date(a.month)
          const dateB = new Date(b.month)
          return dateA.getTime() - dateB.getTime()
        })
        
        setImpactData(chartData)
        setMetrics({
          totalWaste,
          co2Saved,
          waterSaved,
          treesSaved
        })
        
        setLoading(false)
      } catch (error) {
        console.error("Error fetching impact data:", error)
        setLoading(false)
      }
    }
    
    fetchImpactData()
  }, [address, africycle])
  
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Environmental Impact"
        text="Track your contribution to environmental sustainability"
      />

      <div className="grid gap-6">
        {/* Impact Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            <div className="col-span-4 text-center py-8 text-muted-foreground">
              Loading impact metrics...
            </div>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Waste Collected
                  </CardTitle>
                  <IconRecycle className="h-6 w-6" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalWaste.toFixed(1)} kg</div>
                  <p className="text-xs text-muted-foreground">
                    Total waste collected this year
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    CO₂ Emissions Saved
                  </CardTitle>
                  <IconLeaf className="h-6 w-6" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.co2Saved.toFixed(1)} kg</div>
                  <p className="text-xs text-muted-foreground">
                    Equivalent CO₂ emissions prevented
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Water Saved
                  </CardTitle>
                  <IconDroplet className="h-6 w-6" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.waterSaved.toFixed(0)} L</div>
                  <p className="text-xs text-muted-foreground">
                    Water saved through recycling
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Trees Saved
                  </CardTitle>
                  <IconTree className="h-6 w-6" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.treesSaved.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">
                    Equivalent trees saved
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Impact Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Impact Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {loading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Loading impact trends...
                </div>
              ) : impactData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={impactData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="waste"
                      stroke="#22c55e"
                      name="Waste Collected (kg)"
                    />
                    <Line
                      type="monotone"
                      dataKey="emissions"
                      stroke="#3b82f6"
                      name="CO₂ Saved (kg)"
                    />
                    <Line
                      type="monotone"
                      dataKey="water"
                      stroke="#0ea5e9"
                      name="Water Saved (L)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No impact data available yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Environmental Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips to Increase Your Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Sort Your Waste</h3>
                <p className="text-sm text-muted-foreground">
                  Proper sorting increases recycling efficiency and reduces contamination
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Regular Collections</h3>
                <p className="text-sm text-muted-foreground">
                  Maintain a consistent collection schedule to maximize your impact
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Educate Others</h3>
                <p className="text-sm text-muted-foreground">
                  Share your knowledge about proper waste management with your community
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your impact metrics to identify areas for improvement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}