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
} from "@tabler/icons-react"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useAccount, usePublicClient, useChainId, useBalance } from "wagmi"
import { formatEther, parseEther, createPublicClient, http } from "viem"
import { celo } from 'viem/chains'

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

function Transaction({ type, description, amount, date }: TransactionProps) {
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
          <p className="font-medium text-sm sm:text-base">{type}</p>
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
        </div>
      </div>
      <div className="text-left sm:text-right ml-11 sm:ml-0 flex-shrink-0">
        <p className="font-medium text-green-600 text-sm sm:text-base">+{earning.amount.toFixed(2)} cUSD</p>
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

export default function RecyclerWalletPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
  })
  const publicClient = usePublicClient()
  const [loading, setLoading] = useState(true)
  const [cusdBalance, setCusdBalance] = useState<bigint>(BigInt(0))
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [transactions, setTransactions] = useState<TransactionProps[]>([])
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [recyclerEarnings, setRecyclerEarnings] = useState<bigint>(BigInt(0))
  const [userStats, setUserStats] = useState<any>(null)
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })

  // Calculate total earnings from different sources
  const totalEarnings = useMemo(() => {
    // Use the sum of actual calculated earnings instead of contract's stored value
    const calculatedTotal = earnings.reduce((sum, earning) => sum + earning.amount, 0)
    
    // If we have calculated earnings, use that; otherwise fall back to contract value
    if (calculatedTotal > 0) {
      return calculatedTotal.toFixed(4)
    }
    
    // Fallback to contract's stored value
    return formatEther(recyclerEarnings)
  }, [earnings, recyclerEarnings])

  // Memoize the copy to clipboard function
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Address copied to clipboard")
  }, [])

  // Check if user is registered as recycler
  useEffect(() => {
    async function checkRegistration() {
      if (!address || !publicClient) return
      
      try {
        // Get RECYCLER_ROLE constant from contract
        const RECYCLER_ROLE = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: [
            {
              inputs: [],
              name: "RECYCLER_ROLE",
              outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'RECYCLER_ROLE'
        }) as `0x${string}`
        
        // Check if user has RECYCLER_ROLE
        const hasRole = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: [
            {
              inputs: [
                { internalType: "bytes32", name: "role", type: "bytes32" },
                { internalType: "address", name: "account", type: "address" }
              ],
              name: "hasRole",
              outputs: [{ internalType: "bool", name: "", type: "bool" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'hasRole',
          args: [RECYCLER_ROLE, address]
        }) as boolean
        
        setIsRegistered(hasRole)
      } catch (error) {
        console.error("Error checking registration:", error)
        setIsRegistered(false)
      }
    }
    
    if (isConnected) {
      checkRegistration()
    }
  }, [address, isConnected, publicClient])

  // Fetch user data and earnings
  useEffect(() => {
    async function fetchUserData() {
      if (!address || !africycle || !isRegistered) return
      
      try {
        setLoading(true)
        
        // Get user stats
        const stats = await africycle.getUserDetailedStats(address)
        setUserStats(stats)
        setRecyclerEarnings(stats.totalEarnings || BigInt(0))
        
        // Fetch actual processing batches to create real earnings data
        const processingBatches = await africycle.getRecyclerProcessingBatches(address)
        const actualEarnings: Earning[] = []
        
        // Create earnings from completed processing batches
        processingBatches.forEach((batch, index) => {
          if (batch.status === 4) { // COMPLETED status
            // Calculate earnings based on batch data using proper wei calculation
            // Base rate: 0.1 cUSD per kg = 100000000000000000 wei (0.1 * 10^18)
            const baseRatePerKg = BigInt('100000000000000000') // 0.1 cUSD in wei
            const qualityMultiplier = 
              batch.outputQuality === 3 ? BigInt(200) : // PREMIUM (2.0x)
              batch.outputQuality === 2 ? BigInt(150) : // HIGH (1.5x)
              batch.outputQuality === 1 ? BigInt(120) : // MEDIUM (1.2x)
              BigInt(100) // LOW (1.0x)
            
            // earnings = outputAmount * baseRatePerKg * (qualityMultiplier / 100)
            const earningsWei = (batch.outputAmount * baseRatePerKg * qualityMultiplier) / BigInt(100)
            const earnings = parseFloat(formatEther(earningsWei))
            
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
            
            actualEarnings.push({
              id: `batch-${batch.id}`,
              type: "processing",
              amount: earnings,
              date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString(),
              status: "completed",
              description: `${wasteTypeName} processing - ${qualityName} quality`,
              batchId: batch.id.toString()
            })
            
            // Add quality bonus if premium or high quality
            if (batch.outputQuality >= 2) {
              const bonusAmount = earnings * 0.2 // 20% quality bonus
              actualEarnings.push({
                id: `bonus-${batch.id}`,
                type: "quality_bonus",
                amount: bonusAmount,
                date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString(),
                status: "completed",
                description: `${qualityName} quality bonus`,
                batchId: batch.id.toString()
              })
            }
          }
        })
        
        // If no actual earnings, show a placeholder
        if (actualEarnings.length === 0 && stats.totalEarnings > 0) {
          actualEarnings.push({
            id: "total-earnings",
            type: "processing", 
            amount: parseFloat(formatEther(stats.totalEarnings)),
            date: "Various dates",
            status: "completed",
            description: "Total recycling earnings from processing activities"
          })
        }
        
        setEarnings(actualEarnings)
        
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to load user data")
      } finally {
        setLoading(false)
      }
    }
    
    if (isConnected && isRegistered) {
      fetchUserData()
    }
  }, [address, africycle, isConnected, isRegistered])

  // Fetch cUSD balance
  useEffect(() => {
    async function fetchBalances() {
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
    }
    
    if (isConnected) {
      fetchBalances()
    }
  }, [address, isConnected, publicClient])

  // Fetch transaction data - Replace with actual transaction history from blockchain
  useEffect(() => {
    async function fetchTransactions() {
      if (!address || !africycle || !isRegistered) return
      
      try {
        // Fetch actual processing batches to create transaction history
        const processingBatches = await africycle.getRecyclerProcessingBatches(address)
        const actualTransactions: TransactionProps[] = []
        
        // Create transactions from processing batches
        processingBatches.forEach((batch) => {
          if (batch.status === 4) { // COMPLETED
            const wasteTypeName = 
              batch.wasteType === 0 ? "PET Plastic" :
              batch.wasteType === 1 ? "E-Waste" :
              batch.wasteType === 2 ? "Metal" :
              "General Waste"
            
            // Calculate earnings using proper wei calculation
            const baseRatePerKg = BigInt('100000000000000000') // 0.1 cUSD in wei
            const qualityMultiplier = 
              batch.outputQuality === 3 ? BigInt(200) : // PREMIUM (2.0x)
              batch.outputQuality === 2 ? BigInt(150) : // HIGH (1.5x)
              batch.outputQuality === 1 ? BigInt(120) : // MEDIUM (1.2x)
              BigInt(100) // LOW (1.0x)
            
            const earningsWei = (batch.outputAmount * baseRatePerKg * qualityMultiplier) / BigInt(100)
            const earnings = parseFloat(formatEther(earningsWei))
            
            actualTransactions.push({
              type: "Processing",
              description: `${wasteTypeName} batch #${batch.id} completed`,
              amount: `${earnings.toFixed(4)} cUSD`,
              date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString()
            })
            
            // Add platform fee transaction (2% of earnings)
            const fee = earnings * 0.02
            if (fee > 0) {
              actualTransactions.push({
                type: "Fee",
                description: `Platform processing fee for batch #${batch.id}`,
                amount: `${fee.toFixed(4)} cUSD`,
                date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString()
              })
            }
          }
        })
        
        // Sort transactions by date (newest first)
        actualTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        
        // If no actual transactions, show placeholder
        if (actualTransactions.length === 0) {
          actualTransactions.push({
            type: "Processing",
            description: "No processing transactions yet - start by processing waste collections",
            amount: "0.00 cUSD",
            date: "N/A"
          })
        }
        
        setTransactions(actualTransactions)
      } catch (error) {
        console.error("Error fetching transactions:", error)
        // Fallback to empty transactions
        setTransactions([])
      }
    }
    
    if (isConnected && isRegistered) {
      fetchTransactions()
    }
  }, [address, africycle, isConnected, isRegistered])

  // Register as recycler function
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
  }, [address, africycle])

  // Handle withdrawal
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
      
      // Get the actual withdrawable balance from contract
      const stats = await africycle.getUserDetailedStats(address)
      const actualWithdrawableBalance = formatEther(stats.totalEarnings)
      
      console.log("Debug - Withdrawal check:", {
        withdrawAmount,
        actualWithdrawableBalance,
        calculatedTotalEarnings: totalEarnings,
        contractStoredEarnings: stats.totalEarnings.toString()
      })
      
      if (parseFloat(withdrawAmount) > parseFloat(actualWithdrawableBalance)) {
        toast.error(`Insufficient withdrawable balance. You have ${actualWithdrawableBalance} cUSD available to withdraw. 
        
        Note: Processing rewards are tracked separately and require additional verification before becoming withdrawable.`)
        setIsWithdrawing(false)
        return
      }
      
      if (parseFloat(actualWithdrawableBalance) <= 0) {
        toast.error("No withdrawable balance available. Processing rewards require separate verification before becoming withdrawable.")
        setIsWithdrawing(false)
        return
      }
      
      // Convert amount to Wei
      const amountInWei = parseEther(withdrawAmount)
      
      // Call withdraw function
      const txHash = await africycle.withdrawRecyclerEarnings(address, amountInWei)
      
      toast.success(`Successfully withdrew ${withdrawAmount} cUSD`)
      setWithdrawAmount("")
      
      // Add withdrawal transaction to local state immediately
      const withdrawalTransaction: TransactionProps = {
        type: "Withdrawal",
        description: "Earnings withdrawal",
        amount: `${withdrawAmount} cUSD`,
        date: new Date().toLocaleDateString()
      }
      setTransactions(prev => [withdrawalTransaction, ...prev])
      
      // Refresh user data after successful withdrawal
      setTimeout(async () => {
        if (africycle && address) {
          const stats = await africycle.getUserDetailedStats(address)
          setUserStats(stats)
          setRecyclerEarnings(stats.totalEarnings || BigInt(0))
        }
      }, 3000) // Wait 3 seconds for transaction to be mined
      
    } catch (error) {
      console.error("Error withdrawing funds:", error)
      
      // Better error handling
      if (error instanceof Error) {
        if (error.message.includes("Caller is not a recycler")) {
          toast.error("You need to register as a recycler first.")
          setIsRegistered(false)
        } else if (error.message.includes("Insufficient balance")) {
          toast.error("Insufficient withdrawable balance. Processing earnings may need to be claimed separately.")
        } else if (error.message.includes("User is suspended")) {
          toast.error("Your account is suspended. Contact support.")
        } else if (error.message.includes("User is blacklisted")) {
          toast.error("Your account is blacklisted. Contact support.")
        } else {
          toast.error("Withdrawal failed. Please try again.")
        }
      } else {
        toast.error("Withdrawal failed. Please try again.")
      }
    } finally {
      setIsWithdrawing(false)
    }
  }, [address, africycle, withdrawAmount, totalEarnings])

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

  // Refresh data function
  const handleRefresh = useCallback(async () => {
    if (!address || !africycle) return
    
    try {
      setLoading(true)
      
      // Refresh user stats
      const stats = await africycle.getUserDetailedStats(address)
      setUserStats(stats)
      setRecyclerEarnings(stats.totalEarnings || BigInt(0))
      
      // Refresh actual earnings data
      const processingBatches = await africycle.getRecyclerProcessingBatches(address)
      const actualEarnings: Earning[] = []
      
      // Create earnings from completed processing batches
      processingBatches.forEach((batch, index) => {
        if (batch.status === 4) { // COMPLETED status
          // Calculate earnings based on batch data using proper wei calculation
          // Base rate: 0.1 cUSD per kg = 100000000000000000 wei (0.1 * 10^18)
          const baseRatePerKg = BigInt('100000000000000000') // 0.1 cUSD in wei
          const qualityMultiplier = 
            batch.outputQuality === 3 ? BigInt(200) : // PREMIUM (2.0x)
            batch.outputQuality === 2 ? BigInt(150) : // HIGH (1.5x)
            batch.outputQuality === 1 ? BigInt(120) : // MEDIUM (1.2x)
            BigInt(100) // LOW (1.0x)
          
          // earnings = outputAmount * baseRatePerKg * (qualityMultiplier / 100)
          const earningsWei = (batch.outputAmount * baseRatePerKg * qualityMultiplier) / BigInt(100)
          const earnings = parseFloat(formatEther(earningsWei))
          
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
          
          actualEarnings.push({
            id: `batch-${batch.id}`,
            type: "processing",
            amount: earnings,
            date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString(),
            status: "completed",
            description: `${wasteTypeName} processing - ${qualityName} quality`,
            batchId: batch.id.toString()
          })
          
          // Add quality bonus if premium or high quality
          if (batch.outputQuality >= 2) {
            const bonusAmount = earnings * 0.2 // 20% quality bonus
            actualEarnings.push({
              id: `bonus-${batch.id}`,
              type: "quality_bonus",
              amount: bonusAmount,
              date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString(),
              status: "completed",
              description: `${qualityName} quality bonus`,
              batchId: batch.id.toString()
            })
          }
        }
      })
      
      // If no actual earnings, show a placeholder
      if (actualEarnings.length === 0 && stats.totalEarnings > 0) {
        actualEarnings.push({
          id: "total-earnings",
          type: "processing", 
          amount: parseFloat(formatEther(stats.totalEarnings)),
          date: "Various dates",
          status: "completed",
          description: "Total recycling earnings from processing activities"
        })
      }
      
      setEarnings(actualEarnings)
      
      // Refresh transaction data
      const actualTransactions: TransactionProps[] = []
      
      // Create transactions from processing batches
      processingBatches.forEach((batch) => {
        if (batch.status === 4) { // COMPLETED
          const wasteTypeName = 
            batch.wasteType === 0 ? "PET Plastic" :
            batch.wasteType === 1 ? "E-Waste" :
            batch.wasteType === 2 ? "Metal" :
            "General Waste"
          
          // Calculate earnings using proper wei calculation
          const baseRatePerKg = BigInt('100000000000000000') // 0.1 cUSD in wei
          const qualityMultiplier = 
            batch.outputQuality === 3 ? BigInt(200) : // PREMIUM (2.0x)
            batch.outputQuality === 2 ? BigInt(150) : // HIGH (1.5x)
            batch.outputQuality === 1 ? BigInt(120) : // MEDIUM (1.2x)
            BigInt(100) // LOW (1.0x)
          
          const earningsWei = (batch.outputAmount * baseRatePerKg * qualityMultiplier) / BigInt(100)
          const earnings = parseFloat(formatEther(earningsWei))
          
          actualTransactions.push({
            type: "Processing",
            description: `${wasteTypeName} batch #${batch.id} completed`,
            amount: `${earnings.toFixed(4)} cUSD`,
            date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString()
          })
          
          // Add platform fee transaction (2% of earnings)
          const fee = earnings * 0.02
          if (fee > 0) {
            actualTransactions.push({
              type: "Fee",
              description: `Platform processing fee for batch #${batch.id}`,
              amount: `${fee.toFixed(4)} cUSD`,
              date: new Date(Number(batch.timestamp) * 1000).toLocaleDateString()
            })
          }
        }
      })
      
      // Sort transactions by date (newest first)
      actualTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      // If no actual transactions, show placeholder
      if (actualTransactions.length === 0) {
        actualTransactions.push({
          type: "Processing",
          description: "No processing transactions yet - start by processing waste collections",
          amount: "0.00 cUSD",
          date: "N/A"
        })
      }
      
      setTransactions(actualTransactions)
      
      // Refresh balances
      if (publicClient) {
        const cusdBalance = await publicClient.readContract({
          address: CUSD_TOKEN_ADDRESS,
          abi: erc20ABI,
          functionName: 'balanceOf',
          args: [address]
        }) as bigint
        setCusdBalance(cusdBalance)
      }
      
      toast.success("Data refreshed successfully")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh data")
    } finally {
      setLoading(false)
    }
  }, [address, africycle, publicClient])

  // Transaction list component
  const transactionList = loading ? (
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
    <div className="space-y-4">
      {transactions.slice(0, 3).map((transaction, index) => (
        <Transaction key={index} {...transaction} />
      ))}
    </div>
  ) : (
    <div className="text-center py-8">
      <IconHistory className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
      <p className="text-muted-foreground">No transactions yet</p>
    </div>
  )

  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          heading="Wallet"
          text="Manage your recycling earnings and transactions"
        />

        {!isConnected ? (
          <Card className="p-8 text-center">
            <IconWallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view your balance and transaction history
            </p>
            <Button>Connect Wallet</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Balance Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2 sm:p-3 flex-shrink-0">
                    <IconCoin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Calculated Earnings</p>
                    <h3 className="text-lg sm:text-2xl font-bold truncate">{totalEarnings} cUSD</h3>
                    <p className="text-xs text-muted-foreground">From completed processing</p>
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
                    <h3 className="text-lg sm:text-2xl font-bold truncate">{parseFloat(formatEther(recyclerEarnings)).toFixed(4)} cUSD</h3>
                    <p className="text-xs text-muted-foreground">Available for withdrawal</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2 sm:p-3 flex-shrink-0">
                    <IconRecycle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Processing Rewards</p>
                    <h3 className="text-lg sm:text-2xl font-bold truncate">
                      {earnings
                        .filter(e => e.type === "processing")
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toFixed(2)} cUSD
                    </h3>
                    <p className="text-xs text-muted-foreground">From batch completion</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Earnings Status Notice */}
            {parseFloat(totalEarnings) > parseFloat(formatEther(recyclerEarnings)) && (
              <Card className="p-3 sm:p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-3">
                  <IconClock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-yellow-800 text-sm sm:text-base">⚠️ Manual Withdrawal Process</h4>
                    <p className="text-xs sm:text-sm text-yellow-700 mt-1 leading-relaxed">
                      You have earned <strong>{(parseFloat(totalEarnings) - parseFloat(formatEther(recyclerEarnings))).toFixed(4)} cUSD</strong> from 
                      completing processing batches. Currently, recycler withdrawals require manual processing by administrators. 
                      Your processing rewards will be credited to your withdrawable balance through a separate process.
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      🔧 Note: Automated recycler withdrawals are not yet implemented in the smart contract.
                    </p>
                    <div className="mt-3 p-2 sm:p-3 bg-yellow-100 rounded-lg">
                      <p className="text-xs sm:text-sm text-yellow-800 font-medium">To request withdrawal processing:</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Contact support with your address and earned amount for manual processing.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Withdraw Earnings */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Withdraw Earnings</h3>
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
                      {isRegistering ? "Registering..." : "Register as Recycler"}
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
                        max={parseFloat(formatEther(recyclerEarnings))}
                        step="0.01"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {parseFloat(formatEther(recyclerEarnings)).toFixed(4)} cUSD
                      </p>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || !withdrawAmount || recyclerEarnings <= 0}
                    >
                      {isWithdrawing ? "Processing..." : "Withdraw Earnings"}
                    </Button>
                    {recyclerEarnings <= 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        No withdrawable balance available.
                        {parseFloat(totalEarnings) > 0 && " Processing rewards require separate verification before withdrawal."}
                      </p>
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Account Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network:</span>
                    <span className="font-medium">{getChainName(chainId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <button
                      onClick={() => copyToClipboard(address || "")}
                      className="font-mono text-xs hover:text-primary cursor-pointer"
                    >
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
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
                  {userStats && isRegistered && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reputation:</span>
                      <span className="font-medium">{userStats.reputationScore?.toString() || "0"}</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Recent Transactions</h3>
                <Button variant="outline" size="sm">
                  <IconHistory className="mr-2 h-4 w-4" />
                  View All
                </Button>
              </div>
              
              {transactionList}
            </Card>

            {/* Earnings History */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Earnings History</h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading earnings...</p>
                </div>
              ) : earnings.length > 0 ? (
                <div className="space-y-4">
                  {earnings.slice(0, 3).map((earning) => (
                    <EarningItem key={earning.id} earning={earning} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <IconCoin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No earnings history</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
} 