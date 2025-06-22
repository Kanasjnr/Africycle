"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconRefresh,
  IconSend,
  IconWallet,
  IconCoin,
  IconClock,
  IconHistory,
  IconReceipt,
  IconDownload,
  IconRecycle,
  IconShoppingCart,
  IconPackage,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from "@tabler/icons-react"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useRole } from "@/providers/RoleProvider"
import { useAccount, usePublicClient, useChainId, useBalance } from "wagmi"
import { formatEther, parseEther, createPublicClient, http } from "viem"
import { celo } from 'viem/chains'
import afriCycleAbi from "@/ABI/Africycle.json"

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
const CUSD_TOKEN_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`

// ERC20 ABI for cUSD token
const erc20ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" }
    ],
    name: "Transfer",
    type: "event"
  }
] as const

interface TransactionProps {
  type: "Processing" | "Sale" | "Withdrawal" | "Fee"
  description: string
  amount: string
  date: string
  hash?: string
  status?: "completed" | "pending" | "failed"
}

interface Earning {
  id: string
  type: "processing" | "marketplace" | "quality_bonus" | "impact_credit"
  amount: number
  date: string
  status: "completed" | "pending"
  description: string
  batchId?: string
  listingId?: string
}

function Transaction({ type, description, amount, date, status = "completed" }: TransactionProps) {
  const getTransactionStyle = (type: string) => {
    switch (type) {
      case "Processing":
      case "Sale":
        return { icon: IconArrowDown, style: "bg-green-100", color: "text-green-600", prefix: "+" }
      case "Withdrawal":
      case "Fee": 
        return { icon: IconArrowUp, style: "bg-red-100", color: "text-red-600", prefix: "-" }
      default:
        return { icon: IconArrowDown, style: "bg-green-100", color: "text-green-600", prefix: "+" }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <IconCheck className="h-3 w-3 text-green-500" />
      case "pending":
        return <IconClock className="h-3 w-3 text-yellow-500" />
      case "failed":
        return <IconX className="h-3 w-3 text-red-500" />
      default:
        return <IconCheck className="h-3 w-3 text-green-500" />
    }
  }

  const { icon: Icon, style, color, prefix } = getTransactionStyle(type)
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b py-4 last:border-0 gap-3 sm:gap-0">
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 flex-shrink-0 ${style}`}>
          <Icon
            className={`h-4 w-4 ${color}`}
            style={{ transform: "rotate(45deg)" }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm sm:text-base">{type}</p>
            {getStatusIcon(status)}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <div className="text-left sm:text-right ml-11 sm:ml-0 flex-shrink-0">
        <p className={`font-medium text-sm sm:text-base ${color}`}>
          {prefix}{amount}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground">{date}</p>
      </div>
    </div>
  )
}

function EarningItem({ earning }: { earning: Earning }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "marketplace":
        return "bg-green-100 text-green-800"
      case "quality_bonus":
        return "bg-purple-100 text-purple-800"
      case "impact_credit":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "processing":
        return <IconRecycle className="h-4 w-4 text-blue-600" />
      case "marketplace":
        return <IconShoppingCart className="h-4 w-4 text-green-600" />
      case "quality_bonus":
        return <IconCoin className="h-4 w-4 text-purple-600" />
      case "impact_credit":
        return <IconPackage className="h-4 w-4 text-orange-600" />
      default:
        return <IconCoin className="h-4 w-4 text-green-600" />
    }
  }

  const getStatusColor = (status: string) => {
    return status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b py-4 last:border-0 gap-3 sm:gap-0">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-green-100 p-2 flex-shrink-0">
          {getTypeIcon(earning.type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
            <p className="font-medium capitalize text-sm sm:text-base">{earning.type.replace('_', ' ')}</p>
            <Badge variant="secondary" className={`text-xs w-fit ${getTypeColor(earning.type)}`}>
              {earning.type.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">{earning.description}</p>
          {earning.batchId && (
            <p className="text-xs text-blue-600">Batch #{earning.batchId}</p>
          )}
        </div>
      </div>
      <div className="text-left sm:text-right ml-11 sm:ml-0 flex-shrink-0">
        <p className="font-medium text-green-600 text-sm sm:text-base">+{earning.amount.toFixed(4)} cUSD</p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground">{earning.date}</p>
          <Badge variant="secondary" className={`text-xs w-fit ${getStatusColor(earning.status)}`}>
            {earning.status}
          </Badge>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function RecyclerWalletPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
  })
  const publicClient = usePublicClient()
  const { role } = useRole()
  const [loading, setLoading] = useState(true)
  const [cusdBalance, setCusdBalance] = useState<bigint>(BigInt(0))
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [transactions, setTransactions] = useState<TransactionProps[]>([])
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [recyclerStats, setRecyclerStats] = useState<any>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [showAllEarnings, setShowAllEarnings] = useState(false)
  

  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })

  // Calculate total earnings from different sources using the hook's stats
  const totalEarnings = useMemo(() => {
    // Use actual contract data instead of theoretical calculations
    if (recyclerStats && recyclerStats.totalEarnings) {
      return formatEther(recyclerStats.totalEarnings)
    }
    
    // Fallback to user stats if recycler stats not available
    if (userStats && userStats.totalEarnings) {
      return formatEther(userStats.totalEarnings)
    }
    
    return "0.0000"
  }, [recyclerStats, userStats])

  // Get actual earnings per batch from contract data
  const getActualBatchEarnings = useCallback((batch: any) => {
    // Calculate based on contract parameters
    const outputAmount = batch.outputAmount || BigInt(1); // Default to 1kg if not available
    const wasteType = batch.wasteType || 0; // Default to PLASTIC
    const quality = batch.outputQuality || 1; // Default to MEDIUM
    
    // Base rates from contract (in wei)
    const baseRates = [
      BigInt('50000000000000000'),  // PLASTIC: 0.05 cUSD
      BigInt('250000000000000000'), // EWASTE: 0.25 cUSD  
      BigInt('100000000000000000'), // METAL: 0.1 cUSD
      BigInt('25000000000000000')   // GENERAL: 0.025 cUSD
    ];
    
    // Quality multipliers (basis points out of 10000)
    const qualityMultipliers = [8000, 10000, 12000, 15000]; // LOW, MEDIUM, HIGH, PREMIUM
    
    const baseRate = baseRates[wasteType] || baseRates[0];
    const qualityMultiplier = qualityMultipliers[quality] || qualityMultipliers[1];
    
    // Calculate gross payment
    const grossPayment = (outputAmount * baseRate * BigInt(qualityMultiplier)) / BigInt(10000);
    
    // Apply platform fee (5%)
    const netPayment = (grossPayment * BigInt(95)) / BigInt(100);
    
    return parseFloat(formatEther(netPayment));
  }, []) // No dependencies to avoid circular re-renders

  // Get withdrawable balance from user stats
  const withdrawableBalance = useMemo(() => {
    if (userStats && userStats.totalEarnings) {
      return formatEther(userStats.totalEarnings)
    }
    return "0.0000"
  }, [userStats])

  // Calculate historical earnings (total earned minus what's currently withdrawable)
  const historicalEarnings = useMemo(() => {
    // Calculate total earnings from processing batches
    const totalProcessingEarnings = earnings
      .filter(e => e.type === "processing")
      .reduce((sum, e) => sum + e.amount, 0)
    
    // Historical = Total processing earnings - current withdrawable balance
    const withdrawable = parseFloat(withdrawableBalance)
    const historical = Math.max(0, totalProcessingEarnings - withdrawable)
    
    return historical.toFixed(4)
  }, [earnings, withdrawableBalance])

  // Memoize the copy to clipboard function
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Address copied to clipboard")
  }, [])

  // Check if user is registered as recycler using the role from RoleProvider
  const checkRegistration = useCallback(() => {
    const isRecycler = role === "recycler"
    setIsRegistered(isRecycler)
    console.log("Wallet - Role from context:", role, "Is registered:", isRecycler)
  }, [role])

  // Fetch comprehensive user data using the hook's methods
  const fetchUserData = useCallback(async () => {
    if (!address || !africycle || !isRegistered || !publicClient) return
    
    try {
      setLoading(true)
      
      // Fetch user stats, recycler stats, processing batches, and withdrawal transactions in parallel
      const [userStatsData, recyclerStatsData, processingBatches] = await Promise.allSettled([
        africycle.getUserDetailedStats(address),
        africycle.getRecyclerStats(address),
        africycle.getRecyclerProcessingBatches(address)
      ])
      
      // Set user stats
      if (userStatsData.status === 'fulfilled') {
        setUserStats(userStatsData.value)
      }
      
      // Set recycler stats
      if (recyclerStatsData.status === 'fulfilled') {
        setRecyclerStats(recyclerStatsData.value)
      }
      
      // Process earnings from batches
      if (processingBatches.status === 'fulfilled') {
        const actualEarnings: Earning[] = []
        const actualTransactions: TransactionProps[] = []
        
        // Process each completed batch
        for (const batch of processingBatches.value) {
          if (batch.status === 4) { // COMPLETED status
            const wasteTypeName = 
              batch.wasteType === 0 ? "PET Plastic" :
              batch.wasteType === 1 ? "E-Waste" :
              batch.wasteType === 2 ? "Metal" :
              "General Waste"
              
            const qualityName =
              batch.outputQuality === 3 ? "Premium" :
              batch.outputQuality === 2 ? "High" :
              batch.outputQuality === 1 ? "Medium" :
              "Standard"
            
            // Use the getActualBatchEarnings function to calculate earnings
            const calculatedEarnings = getActualBatchEarnings(batch);
            
            console.log(`Debug: Batch ${batch.id} - calculated earnings:`, {
              outputAmount: batch.outputAmount.toString(),
              outputQuality: batch.outputQuality,
              wasteType: batch.wasteType,
              calculatedEarnings: calculatedEarnings,
              batchId: batch.id.toString()
            });
            
            // Add to transaction history with actual calculated amount
            actualTransactions.push({
              type: "Processing",
              description: `${wasteTypeName} batch #${batch.id} completed → Paid to wallet`,
              amount: `${calculatedEarnings.toFixed(4)} cUSD`,
              date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString(),
              status: "completed"
            })
            
            // Add to earnings history with actual calculated amount
            actualEarnings.push({
              id: `batch-${batch.id}`,
              type: "processing",
              amount: calculatedEarnings,
              date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString(),
              status: "completed",
              description: `${wasteTypeName} processing - ${qualityName} quality (${batch.outputAmount.toString()}kg output)`,
              batchId: batch.id.toString()
            })
          }
        }
        
        // Try to fetch withdrawal logs separately with better error handling
        let withdrawalTransactions: TransactionProps[] = []
        try {
          console.log('Fetching withdrawal logs for address:', address)
          
          // TODO: Implement proper withdrawal event detection
          // For now, we'll only show actual withdrawal transactions when they occur
          // This requires properly parsing the contract events with the right ABI
          
          // Note: The contract should emit withdrawal events that we can detect
          // Until then, we'll only show withdrawals when they actually happen
          
        } catch (error) {
          console.error('Error fetching withdrawal logs:', error)
        }
        
        // Only add actual withdrawal transactions to the main transaction list
        // Remove the hardcoded test withdrawal that was incorrectly added
        actualTransactions.push(...withdrawalTransactions)
        console.log('Total transactions after adding withdrawals:', actualTransactions.length)
        
        // Sort by date (newest first)
        actualEarnings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        actualTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        setEarnings(actualEarnings)
        setTransactions(actualTransactions)
      }
      
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast.error("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }, [address, africycle, isRegistered, publicClient, getActualBatchEarnings])

  // Fetch cUSD balance
  const fetchBalances = useCallback(async () => {
    if (!address || !publicClient) return
    
    try {
      const cusdBalance = await publicClient.readContract({
        address: CUSD_TOKEN_ADDRESS,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [address]
      }) as bigint
      setCusdBalance(cusdBalance)
    } catch (error) {
      console.error("Error fetching balances:", error)
    }
  }, [address, publicClient])

  // Register as recycler using the hook
  const handleRegisterRecycler = useCallback(async () => {
    if (!address || !africycle) {
      toast.error("Please connect your wallet first")
      return
    }
    
    try {
      setIsRegistering(true)
      await africycle.registerRecycler(address, "Recycler", "recycler@africycle.com", "Lagos, Nigeria")
      toast.success("Successfully registered as recycler!")
      setIsRegistered(true)
      // Refresh data after registration
      setTimeout(() => {
        fetchUserData()
      }, 2000)
    } catch (error) {
      console.error("Registration error:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.'
      )
    } finally {
      setIsRegistering(false)
    }
  }, [address, africycle, fetchUserData])

  // Handle withdrawal using the hook
  const handleWithdraw = useCallback(async () => {
    if (!address || !africycle) {
      toast.error("Please connect your wallet first")
      return
    }
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid withdrawal amount")
      return
    }
    
    try {
      setIsWithdrawing(true)
      
      const withdrawAmountFloat = parseFloat(withdrawAmount)
      const availableBalance = parseFloat(withdrawableBalance)
      
      if (withdrawAmountFloat > availableBalance) {
        toast.error(`Insufficient withdrawable balance. You have ${availableBalance} cUSD available to withdraw.`)
        return
      }
      
      if (availableBalance <= 0) {
        toast.error("No withdrawable balance available.")
        return
      }
      
      // Convert amount to Wei
      const amountInWei = parseEther(withdrawAmount)
      
      // Call withdraw function using the hook
      const txHash = await africycle.withdrawRecyclerEarnings(address, amountInWei)
      
      toast.success(`Successfully withdrew ${withdrawAmount} cUSD. Transaction: ${txHash}`)
      setWithdrawAmount("")
      
      // Refresh data after withdrawal to fetch updated blockchain state
      setTimeout(() => {
        fetchUserData()
        fetchBalances()
      }, 3000)
      
    } catch (error) {
      console.error("Error withdrawing funds:", error)
      
      if (error instanceof Error) {
        if (error.message.includes("Caller is not a recycler")) {
          toast.error("You need to register as a recycler first.")
          setIsRegistered(false)
        } else if (error.message.includes("Insufficient balance")) {
          toast.error("Insufficient withdrawable balance.")
        } else if (error.message.includes("User is suspended")) {
          toast.error("Your account is suspended. Contact support.")
        } else if (error.message.includes("User is blacklisted")) {
          toast.error("Your account is blacklisted. Contact support.")
        } else {
          toast.error("Withdrawal failed: " + error.message)
        }
      } else {
        toast.error("Withdrawal failed. Please try again.")
      }
    } finally {
      setIsWithdrawing(false)
    }
  }, [address, africycle, withdrawAmount, withdrawableBalance, fetchUserData, fetchBalances])

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case 42220:
        return "Celo Mainnet"
      case 44787:
        return "Celo Alfajores"
      default:
        return "Unknown Chain"
    }
  }

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    if (!address || !africycle || !isRegistered) return
    
    try {
      setRefreshing(true)
      await Promise.all([
        fetchUserData(),
        fetchBalances()
      ])
      toast.success("Data refreshed successfully")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh data")
    } finally {
      setRefreshing(false)
    }
  }, [address, africycle, isRegistered, fetchUserData, fetchBalances])



  // Effects
  useEffect(() => {
    if (isConnected && address) {
      checkRegistration()
      fetchBalances()
    }
  }, [isConnected, address, checkRegistration, fetchBalances])

  useEffect(() => {
    if (isConnected && isRegistered) {
      fetchUserData()
    }
  }, [isConnected, isRegistered, fetchUserData])

  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recycler Wallet</h1>
            <p className="text-muted-foreground mt-2">Manage your recycling earnings and transactions</p>
          </div>
          {isConnected && isRegistered && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          )}
        </div>

        {!isConnected ? (
          <Card className="p-8 text-center">
            <IconWallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your balance and transaction history
            </p>
            <Button>Connect Wallet</Button>
          </Card>
        ) : loading && isRegistered ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-6">
            {/* Balance Overview */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2 sm:p-3 flex-shrink-0">
                    <IconCoin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <h3 className="text-lg sm:text-2xl font-bold truncate">{totalEarnings} cUSD</h3>
                    <p className="text-xs text-muted-foreground">From processing activities</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2 sm:p-3 flex-shrink-0">
                    <IconWallet className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Withdrawable Balance</p>
                    <h3 className="text-lg sm:text-2xl font-bold truncate">{withdrawableBalance} cUSD</h3>
                    <p className="text-xs text-muted-foreground">Available for withdrawal</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Balance Status Notice */}
            {parseFloat(withdrawableBalance) > 0 && (
              <Card className="p-3 sm:p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <IconCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-green-800 text-sm sm:text-base">Funds Available</h4>
                    <p className="text-xs sm:text-sm text-green-700 mt-1 leading-relaxed">
                      You have <strong>{withdrawableBalance} cUSD</strong> available for withdrawal from your recycling activities.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Payment System Explanation */}
            <Card className="p-3 sm:p-4 bg-blue-50 border-blue-200">
              <div className="flex items-start gap-3">
                <IconRecycle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-blue-800 text-sm sm:text-base">How Recycler Payments Work</h4>
                  <div className="text-xs sm:text-sm text-blue-700 mt-1 leading-relaxed space-y-1">
                    <p><strong>Processing Completion:</strong> Earnings are paid directly to your wallet automatically</p>
                    <p><strong>Contract Balance:</strong> Additional rewards accumulate here and can be withdrawn manually</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Withdraw Earnings & Account Status */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <IconWallet className="h-5 w-5" />
                  Withdraw Earnings
                </h3>
                {!isRegistered ? (
                  <div className="text-center py-8">
                    <IconWallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">Register as Recycler</h4>
                    <p className="text-muted-foreground mb-4">
                      You need to register as a recycler to earn and withdraw funds
                    </p>
                    <Button 
                      onClick={handleRegisterRecycler}
                      disabled={isRegistering}
                      className="w-full"
                    >
                      {isRegistering ? (
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 animate-spin" />
                          Registering...
                        </div>
                      ) : (
                        "Register as Recycler"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Amount (cUSD)</label>
                      <Input
                        type="number"
                        placeholder="Enter amount to withdraw"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        max={parseFloat(withdrawableBalance)}
                        step="0.01"
                        disabled={isWithdrawing}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {withdrawableBalance} cUSD
                      </p>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawableBalance) <= 0}
                    >
                      {isWithdrawing ? (
                        <div className="flex items-center gap-2">
                          <IconClock className="h-4 w-4 animate-spin" />
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <IconSend className="h-4 w-4" />
                          Withdraw Earnings
                        </div>
                      )}
                    </Button>
                    {parseFloat(withdrawableBalance) <= 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        No withdrawable balance available. Complete processing batches to earn rewards.
                      </p>
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <IconCopy className="h-5 w-5" />
                  Account Status
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network:</span>
                    <span className="font-medium">{getChainName(chainId)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Address:</span>
                    <button
                      onClick={() => copyToClipboard(address || "")}
                      className="font-mono text-xs hover:text-primary cursor-pointer flex items-center gap-1"
                    >
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                      <IconCopy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recycler Status:</span>
                    <Badge variant={isRegistered ? "default" : "destructive"}>
                      {isRegistered ? "Registered" : "Not Registered"}
                    </Badge>
                  </div>
                  {recyclerStats && isRegistered && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reputation:</span>
                        <span className="font-medium">{recyclerStats.reputationScore?.toString() || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Inventory:</span>
                        <span className="font-medium">{formatEther(recyclerStats.totalInventory || BigInt(0))} kg</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <IconHistory className="h-5 w-5" />
                  Recent Transactions
                </h3>
                <Button variant="outline" size="sm">
                  <IconHistory className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-0">
                  {transactions.slice(0, 5).map((transaction, index) => (
                    <Transaction key={index} {...transaction} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconHistory className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Start processing waste collections to see your transactions</p>
                </div>
              )}
            </Card>

            {/* Earnings History */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <IconCoin className="h-5 w-5" />
                Earnings History
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Loading earnings...</p>
                </div>
              ) : earnings.length > 0 ? (
                <div className="space-y-0">
                  {earnings.slice(0, 5).map((earning) => (
                    <EarningItem key={earning.id} earning={earning} />
                  ))}
                  {earnings.length > 5 && (
                    <div className="text-center pt-4">
                      <Button variant="outline" size="sm">
                        View All {earnings.length} Earnings
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconCoin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No earnings history</p>
                  <p className="text-sm text-muted-foreground mt-1">Complete processing batches to start earning rewards</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
} 