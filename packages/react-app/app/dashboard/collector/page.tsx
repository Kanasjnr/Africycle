"use client"

import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconBox, IconCamera, IconMap2, IconWallet } from "@tabler/icons-react"
import { MetricCard } from "@/components/dashboard/metric-card"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useAccount, useWalletClient } from "wagmi"
import { formatEther } from "viem"

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || ""

console.log('Contract configuration:', {
  hasContractAddress: !!CONTRACT_ADDRESS,
  contractAddress: CONTRACT_ADDRESS,
  hasRpcUrl: !!RPC_URL,
  rpcUrl: RPC_URL ? 'present' : 'missing'
})

// Add timeout constant
const FETCH_TIMEOUT = 10000; // 10 seconds

// Memoized components
const MemoizedMetricCard = memo((props: Parameters<typeof MetricCard>[0]) => {
  return <MetricCard {...props} />
})
MemoizedMetricCard.displayName = 'MemoizedMetricCard'

const MemoizedDashboardHeader = memo((props: Parameters<typeof DashboardHeader>[0]) => {
  return <DashboardHeader {...props} />
})
MemoizedDashboardHeader.displayName = 'MemoizedDashboardHeader'

// Update the component props to include className
interface DashboardShellProps {
  children: React.ReactNode;
  className?: string;
}

interface DashboardHeaderProps {
  heading: string;
  text: string;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  trend: {
    value: number;
    label: string;
    positive: boolean;
  };
  icon: React.ReactNode;
  className?: string;
}

export default function CollectorDashboard() {
  const { address, isConnected, status } = useAccount()
  const { data: walletClient, isLoading: isWalletClientLoading } = useWalletClient()
  const [isClient, setIsClient] = useState(false)

  // Memoize the contract configuration
  const contractConfig = useMemo(() => ({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  }), [])

  // Handle hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  console.log('Wallet connection state:', { 
    address, 
    isConnected, 
    status,
    hasWalletClient: !!walletClient,
    isWalletClientLoading,
    isClient
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collectorStats, setCollectorStats] = useState<any>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3
  
  // Initialize the AfriCycle hook with memoized config
  const africycle = useAfriCycle(contractConfig)

  // Check if AfriCycle is properly initialized
  const isAfriCycleReady = useMemo(() => {
    if (!africycle) return false
    try {
      // Test if getCollectorStats is available and callable
      return typeof africycle.getCollectorStats === 'function'
    } catch {
      return false
    }
  }, [africycle])

  // Memoize the fetch function with stable dependencies
  const fetchCollectorData = useCallback(async () => {
    if (!address || !africycle || !isAfriCycleReady) {
      console.log('Fetch prerequisites not met:', {
        hasAddress: !!address,
        hasAfriCycle: !!africycle,
        isAfriCycleReady,
        address,
        africycleInstance: africycle ? 'present' : 'missing'
      })
      setLoading(false)
      setError('Wallet or contract not ready')
      return
    }
    
    try {
      console.log('Starting collector data fetch...', {
        address,
        hasAfriCycle: !!africycle,
        isAfriCycleReady,
        retryCount
      })
      
      setLoading(true)
      setError(null)
      
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Fetch timeout')), FETCH_TIMEOUT)
      })
      
      // Race between the actual fetch and the timeout
      const stats = await Promise.race([
        (async () => {
          try {
            console.log('Calling getCollectorStats...')
            const result = await africycle.getCollectorStats(address)
            console.log('getCollectorStats result:', result)
            return result
          } catch (error) {
            console.error('Error in getCollectorStats:', error)
            throw error
          }
        })(),
        timeoutPromise
      ])
      
      console.log('Collector stats fetched successfully:', stats)
      setCollectorStats(stats)
      setRetryCount(0) // Reset retry count on success
      setLoading(false) // Explicitly set loading to false after successful fetch
    } catch (error) {
      console.error("Error fetching collector data:", error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data'
      console.log('Setting error state:', {
        errorMessage,
        retryCount,
        maxRetries: MAX_RETRIES
      })
      setError(errorMessage)
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        const nextRetry = retryCount + 1
        console.log(`Scheduling retry ${nextRetry} of ${MAX_RETRIES}...`)
        setRetryCount(nextRetry)
        // Wait a bit before retrying, with exponential backoff
        setTimeout(() => {
          console.log(`Executing retry ${nextRetry} of ${MAX_RETRIES}...`)
          fetchCollectorData()
        }, 1000 * Math.pow(2, retryCount)) // Exponential backoff
      } else {
        console.log('Max retries reached, stopping fetch attempts')
        setLoading(false)
      }
    }
  }, [address, africycle, isAfriCycleReady, retryCount])

  // Use a ref to track if we've already fetched data
  const hasFetchedRef = useRef(false)

  // Optimize the effect to only fetch when necessary
  useEffect(() => {
    console.log('Data fetch effect triggered:', {
      hasFetched: hasFetchedRef.current,
      hasAddress: !!address,
      isAfriCycleReady,
      address
    })
    
    if (!hasFetchedRef.current && address && isAfriCycleReady) {
      console.log('Initiating initial data fetch...')
      hasFetchedRef.current = true
      fetchCollectorData()
    }
  }, [address, fetchCollectorData, isAfriCycleReady])

  // Reset hasFetchedRef when address changes
  useEffect(() => {
    console.log('Address changed, resetting fetch state:', address)
    hasFetchedRef.current = false
  }, [address])

  // Log wallet address changes
  useEffect(() => {
    console.log('Wallet address changed:', address)
  }, [address])
  
  // Log africycle instance changes
  useEffect(() => {
    console.log('AfriCycle instance changed:', !!africycle)
  }, [africycle])
  
  // Log collectorStats changes
  useEffect(() => {
    console.log('Collector stats updated:', collectorStats)
  }, [collectorStats])

  // Log loading state changes
  useEffect(() => {
    console.log('Loading state changed:', loading)
  }, [loading])

  // Memoize the metrics data to prevent unnecessary re-renders
  const metricsData = useMemo(() => {
    console.log('Calculating metrics data with stats:', collectorStats)
    if (!collectorStats) return null

    const data = {
      totalCollected: {
        title: "Total Collected",
        value: `${collectorStats.totalCollected.toString() || '0'} kg`,
        trend: { value: 12, label: "from last month", positive: true },
        icon: <IconBox className="h-4 w-4" />
      },
      earnings: {
        title: "Earnings",
        value: `${formatEther(collectorStats.totalEarnings || BigInt(0))} cUSD`,
        trend: { value: 8, label: "from last month", positive: true },
        icon: <IconWallet className="h-4 w-4" />
      },
      pendingVerification: {
        title: "Pending Verification",
        value: collectorStats.pendingVerifications.toString() || '0',
        trend: { value: 2, label: "from last month", positive: false },
        icon: <IconCamera className="h-4 w-4" />
      },
      verifiedCollections: {
        title: "Verified Collections",
        value: collectorStats.verifiedCollections.toString() || '0',
        trend: { value: 15, label: "from last month", positive: true },
        icon: <IconBox className="h-4 w-4" />
      }
    }
    console.log('Calculated metrics data:', data)
    return data
  }, [collectorStats])
  
  // Log metricsData changes
  useEffect(() => {
    console.log('Metrics data updated:', !!metricsData)
  }, [metricsData])

  // Show loading state during initial client-side render
  if (!isClient) {
    return (
      <DashboardShell>
        <MemoizedDashboardHeader
          heading="Collector Dashboard"
          text="Track your collections and manage your recycling activities"
        />
        <div className="grid gap-6">
          <Card>
            <div className="p-6 text-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  // Show wallet connection message if needed
  if (!isConnected || status !== 'connected') {
    return (
      <DashboardShell>
        <MemoizedDashboardHeader
          heading="Collector Dashboard"
          text="Track your collections and manage your recycling activities"
        />
        <div className="grid gap-6">
          <Card>
            <div className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Wallet Connection Required</h2>
              <p className="text-muted-foreground mb-4">
                {status === 'reconnecting' 
                  ? "Reconnecting to your wallet... Please wait while we establish a secure connection."
                  : "Please connect your wallet to view your collector dashboard."}
              </p>
              {status === 'reconnecting' && (
                <div className="animate-pulse text-sm text-muted-foreground mt-2">
                  This may take a few moments...
                </div>
              )}
              {!isConnected && (
                <Button
                  onClick={() => {
                    // This will trigger the wallet connection modal
                    window.location.reload()
                  }}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  // Show loading state while wallet client is initializing
  if (isWalletClientLoading || !walletClient) {
    return (
      <DashboardShell>
        <MemoizedDashboardHeader
          heading="Collector Dashboard"
          text="Track your collections and manage your recycling activities"
        />
        <div className="grid gap-6">
          <Card>
            <div className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Initializing Wallet Connection</h2>
              <p className="text-muted-foreground mb-4">
                Please wait while we initialize your wallet connection...
              </p>
              <div className="animate-pulse text-sm text-muted-foreground mt-2">
                This may take a few moments...
              </div>
            </div>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  // Show loading state while AfriCycle is initializing
  if (!isAfriCycleReady) {
    return (
      <DashboardShell>
        <MemoizedDashboardHeader
          heading="Collector Dashboard"
          text="Track your collections and manage your recycling activities"
        />
        <div className="grid gap-6">
          <Card>
            <div className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Initializing Contract Connection</h2>
              <p className="text-muted-foreground mb-4">
                Please wait while we establish a connection to the smart contract...
              </p>
              <div className="animate-pulse text-sm text-muted-foreground mt-2">
                This may take a few moments...
              </div>
            </div>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden">
      <DashboardShell>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="mb-6">
            <MemoizedDashboardHeader
              heading="Collector Dashboard"
              text="Track your collections and manage your recycling activities"
            />
          </div>
          
          {/* Main Content Grid */}
          <div className="grid gap-6">
            {/* Metrics Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-muted-foreground">
                    Loading metrics...
                    {retryCount > 0 && (
                      <div className="text-sm mt-2">
                        Retry attempt {retryCount}/{MAX_RETRIES}
                      </div>
                    )}
                  </div>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-8 text-red-500">
                  <div className="max-w-md mx-auto">
                    {error}
                    <Button 
                      variant="outline" 
                      className="mt-4 w-full sm:w-auto"
                      onClick={() => {
                        setRetryCount(0)
                        setLoading(true)
                        fetchCollectorData()
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : metricsData ? (
                <>
                  <div className="h-full">
                    <MemoizedMetricCard {...metricsData.totalCollected} />
                  </div>
                  <div className="h-full">
                    <MemoizedMetricCard {...metricsData.earnings} />
                  </div>
                  <div className="h-full">
                    <MemoizedMetricCard {...metricsData.pendingVerification} />
                  </div>
                  <div className="h-full">
                    <MemoizedMetricCard {...metricsData.verifiedCollections} />
                  </div>
                </>
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No data available
                </div>
              )}
            </div>

            {/* Collection History */}
            <Card className="w-full">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-2">Collection History</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Your waste collection history over time
                </p>
                <div className="mt-4 h-[200px] w-full">
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-muted-foreground text-center px-4">
                        Loading collection history...
                        {retryCount > 0 && (
                          <div className="text-sm mt-2">
                            Retry attempt {retryCount}/{MAX_RETRIES}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : error ? (
                    <div className="flex h-full items-center justify-center text-red-500 px-4 text-center">
                      {error}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8 px-4">
                      {collectorStats?.verifiedCollections > 0 
                        ? "Collection history chart will appear here" 
                        : "No collection history available yet"}
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div className="p-4 sm:p-6">
                <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Common tasks for waste collectors
                </p>
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Scan QR Code */}
                  <Button
                    variant="outline"
                    className="group relative w-full h-[72px] sm:h-[88px] flex flex-col items-center justify-center p-3 space-y-2 hover:bg-accent transition-colors"
                    onClick={() => window.location.href = "/dashboard/collector/scanner"}
                  >
                    <IconBox className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm sm:text-base font-medium text-center">Scan QR Code</span>
                  </Button>

                  {/* View Collection Map */}
                  <Button
                    variant="outline"
                    className="group relative w-full h-[72px] sm:h-[88px] flex flex-col items-center justify-center p-3 space-y-2 hover:bg-accent transition-colors"
                    onClick={() => window.location.href = "/dashboard/collector/map"}
                  >
                    <IconMap2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm sm:text-base font-medium text-center">View Collection Map</span>
                  </Button>

                  {/* Upload Verification Photo */}
                  <Button
                    variant="outline"
                    className="group relative w-full h-[72px] sm:h-[88px] flex flex-col items-center justify-center p-3 space-y-2 hover:bg-accent transition-colors"
                    onClick={() => window.location.href = "/dashboard/collector/verification"}
                  >
                    <IconCamera className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm sm:text-base font-medium text-center">Upload Verification Photo</span>
                  </Button>

                  {/* View Wallet */}
                  <Button
                    variant="outline"
                    className="group relative w-full h-[72px] sm:h-[88px] flex flex-col items-center justify-center p-3 space-y-2 hover:bg-accent transition-colors"
                    onClick={() => window.location.href = "/dashboard/collector/wallet"}
                  >
                    <IconWallet className="h-6 w-6 sm:h-7 sm:w-7 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-sm sm:text-base font-medium text-center">View Wallet</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DashboardShell>
    </div>
  )
}