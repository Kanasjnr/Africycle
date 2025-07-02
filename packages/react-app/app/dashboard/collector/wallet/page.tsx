"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
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
  IconGift,
} from "@tabler/icons-react"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useAccount, usePublicClient, useChainId, useBalance, useWalletClient } from "wagmi"
import { formatEther, parseEther, createPublicClient, http } from "viem"
import { celo } from 'viem/chains'

// G$ UBI SDK imports 
import { useIdentitySDK, ClaimSDK } from '@goodsdks/citizen-sdk'

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
const CUSD_TOKEN_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`

// G$ contract addresses (Celo mainnet)
const G_DOLLAR_TOKEN_ADDRESS = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A" as `0x${string}`
const UBI_SCHEME_PROXY_ADDRESS = "0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1" as `0x${string}`

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
  type: "Deposit" | "Withdrawal"
  description: string
  amount: string
  date: string
  hash?: string
}

interface Earning {
  id: string
  type: "collection" | "referral" | "bonus" | "g_dollar_ubi"
  amount: number
  date: string
  status: "completed" | "pending"
  description: string
  collectionId?: string
}

function Transaction({ type, description, amount, date }: TransactionProps) {
  const isDeposit = type === "Deposit"
  return (
    <div className="flex items-center justify-between border-b py-3 sm:py-4 last:border-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div
          className={`rounded-full p-1.5 sm:p-2 shrink-0 ${
            isDeposit ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isDeposit ? (
            <IconArrowDown
              className="h-3 w-3 sm:h-4 sm:w-4 text-green-600"
              style={{ transform: "rotate(45deg)" }}
            />
          ) : (
            <IconArrowUp
              className="h-3 w-3 sm:h-4 sm:w-4 text-red-600"
              style={{ transform: "rotate(45deg)" }}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-medium truncate">{type}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{description}</p>
        </div>
      </div>
      <div className="text-right ml-2 shrink-0">
        <p
          className={`text-sm sm:text-base font-medium ${
            isDeposit ? "text-green-600" : "text-red-600"
          }`}
        >
          {isDeposit ? "+" : "-"}
          {amount}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{date}</p>
      </div>
    </div>
  )
}

function EarningItem({ earning }: { earning: Earning }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "collection":
        return "bg-blue-100 text-blue-800"
      case "referral":
        return "bg-green-100 text-green-800"
      case "bonus":
        return "bg-purple-100 text-purple-800"
      case "g_dollar_ubi":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    return status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  const getTypeIcon = (type: string) => {
    if (type === "g_dollar_ubi") {
      return <IconGift className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
    }
    return <IconCoin className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
  }

  const getDisplayType = (type: string) => {
    if (type === "g_dollar_ubi") return "G$ UBI"
    return type
  }

  const getCurrency = (type: string) => {
    if (type === "g_dollar_ubi") return "G$"
    return "cUSD"
  }

  return (
    <div className="flex items-center justify-between border-b py-3 sm:py-4 last:border-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className={`rounded-lg p-1.5 sm:p-2 shrink-0 ${earning.type === "g_dollar_ubi" ? "bg-yellow-100" : "bg-green-100"}`}>
          {getTypeIcon(earning.type)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 sm:gap-2 mb-1">
            <p className="text-sm sm:text-base font-medium capitalize truncate">{getDisplayType(earning.type)}</p>
            <Badge variant="secondary" className={`text-xs shrink-0 ${getTypeColor(earning.type)}`}>
              {getDisplayType(earning.type)}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{earning.description}</p>
        </div>
      </div>
      <div className="text-right ml-2 shrink-0">
        <p className={`text-sm sm:text-base font-medium ${earning.type === "g_dollar_ubi" ? "text-yellow-600" : "text-green-600"}`}>
          +{earning.amount.toFixed(2)} {getCurrency(earning.type)}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <p className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{earning.date}</p>
          <Badge variant="secondary" className={`text-xs ${getStatusColor(earning.status)}`}>
            {earning.status}
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Custom hook for countdown
const useCountdown = (targetDate: Date | null) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null)

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(null)
      return
    }

    const updateCountdown = () => {
      const now = new Date().getTime()
      const target = targetDate.getTime()
      const difference = target - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft(null)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return timeLeft
}

export default function WalletPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
  })
  const publicClient = usePublicClient()
  const [loading, setLoading] = useState(true)
  const [cusdBalance, setCusdBalance] = useState<bigint>(BigInt(0))
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [transactions, setTransactions] = useState<TransactionProps[]>([])
  const [lastFetchedBlock, setLastFetchedBlock] = useState<bigint | null>(null)
  const [earnings, setEarnings] = useState<Earning[]>([])
  const [collectorEarnings, setCollectorEarnings] = useState<bigint>(BigInt(0))
  const [userStats, setUserStats] = useState<any>(null)
  const [isRegistered, setIsRegistered] = useState<boolean>(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [contractBalance, setContractBalance] = useState<bigint>(BigInt(0))

  // G$ UBI state
  const [gDollarEntitlement, setGDollarEntitlement] = useState<bigint>(BigInt(0))
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimSDK, setClaimSDK] = useState<ClaimSDK | null>(null)
  const [isInitializingSDK, setIsInitializingSDK] = useState(false)
  const [isWhitelisted, setIsWhitelisted] = useState<boolean>(false)
  const [whitelistRoot, setWhitelistRoot] = useState<string | null>(null)
  const [isCheckingWhitelist, setIsCheckingWhitelist] = useState(false)
  const [verificationLink, setVerificationLink] = useState<string | null>(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [totalGDollarsClaimed, setTotalGDollarsClaimed] = useState<number>(0)
  const [gDollarClaimCount, setGDollarClaimCount] = useState<number>(0)

  // Use the countdown hook
  const countdown = useCountdown(nextClaimTime)

  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })

  // Initialize G$ hooks
  const { data: walletClient } = useWalletClient()
  const identitySDK = useIdentitySDK('production')

  // Memoize the formatted balances
  const formattedBalances = useMemo(() => ({
    cusd: formatEther(cusdBalance),
    earnings: balance ? formatEther(balance.value) : "0"
  }), [cusdBalance, balance])

  // Memoize the copy to clipboard function
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Address copied to clipboard")
  }, [])

  // Initialize G$ Claim SDK and fetch UBI data (fixed infinite loop)
  useEffect(() => {
    let isMounted = true
    
    async function initializeAndFetchUBI() {
      console.log('🔵 G$ UBI: Starting initialization check...')
      console.log('🔵 G$ UBI: Dependencies:', {
        address: !!address,
        publicClient: !!publicClient,
        walletClient: !!walletClient,
        identitySDK: !!identitySDK,
        isConnected
      })
      
      // Only initialize if we have all required dependencies
      if (!address || !publicClient || !walletClient || !identitySDK) {
        console.log('🟡 G$ UBI: Missing dependencies, skipping initialization')
        return
      }

      // Prevent re-initialization if already checking or initialized
      if (isInitializingSDK || isCheckingWhitelist) {
        console.log('🟡 G$ UBI: Already initializing, skipping...')
        return
      }

      setIsInitializingSDK(true)
      console.log('🔵 G$ UBI: Starting SDK initialization...')
      
      try {
        // First, check if user is whitelisted
        console.log('🔵 G$ UBI: Checking whitelist status...')
        setIsCheckingWhitelist(true)
        
        const { isWhitelisted, root } = await identitySDK.getWhitelistedRoot(address)
        console.log('📊 G$ UBI: Whitelist result:', {
          isWhitelisted,
          root,
          address
        })
        
        if (!isMounted) return
        
        setIsWhitelisted(isWhitelisted)
        setWhitelistRoot(root)
        setIsCheckingWhitelist(false)
        
        if (isWhitelisted) {
          // User is whitelisted, proceed with ClaimSDK initialization
          console.log('✅ G$ UBI: User is whitelisted, initializing ClaimSDK...')
          
          const sdk = new ClaimSDK({
            account: address,
            publicClient,
            walletClient,
            identitySDK: identitySDK,
            env: 'production',
          })
          console.log('✅ G$ UBI: ClaimSDK created successfully')
          
          if (!isMounted) return
          
          setClaimSDK(sdk)
          console.log('✅ G$ UBI: ClaimSDK set in state')

          // Fetch UBI data for whitelisted user
          try {
            console.log('🔵 G$ UBI: Checking entitlement for whitelisted user...')
            const entitlement = await sdk.checkEntitlement()
            console.log('📊 G$ UBI: Entitlement result:', {
              entitlement: entitlement.toString(),
              entitlementType: typeof entitlement,
              entitlementBigInt: entitlement,
              entitlementInEther: formatEther(entitlement)
            })
            
            console.log('🔵 G$ UBI: Checking next claim time...')
            const nextClaim = await sdk.nextClaimTime()
            console.log('📊 G$ UBI: Next claim result:', {
              nextClaim,
              nextClaimType: typeof nextClaim,
              nextClaimDate: nextClaim ? new Date(nextClaim) : null,
              isValidDate: nextClaim ? !isNaN(new Date(nextClaim).getTime()) : false
            })
            
            if (isMounted) {
              setGDollarEntitlement(entitlement)
              setNextClaimTime(nextClaim)
              console.log('✅ G$ UBI: State updated successfully for whitelisted user')
            }
          } catch (fetchError) {
            console.error('❌ G$ UBI: Failed to fetch UBI data:', fetchError)
            console.error('❌ G$ UBI: Error details:', {
              message: fetchError instanceof Error ? fetchError.message : String(fetchError),
              stack: fetchError instanceof Error ? fetchError.stack : undefined,
              name: fetchError instanceof Error ? fetchError.name : 'Unknown'
            })
          }
        } else {
          // User is not whitelisted - we'll show verification flow
          console.log('🟡 G$ UBI: User is not whitelisted, will show verification flow')
        }
        
      } catch (error) {
        console.error('❌ G$ UBI: Failed to initialize:', error)
        console.error('❌ G$ UBI: Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown'
        })
      } finally {
        if (isMounted) {
          setIsInitializingSDK(false)
          setIsCheckingWhitelist(false)
          console.log('🔵 G$ UBI: Initialization process completed')
        }
      }
    }

    initializeAndFetchUBI()
    
    return () => {
      isMounted = false
    }
  }, [address, isConnected]) // Removed identitySDK from dependencies to prevent infinite loop

  // Load G$ claim statistics from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && address) {
      const savedStats = localStorage.getItem(`gDollarStats_${address}`)
      if (savedStats) {
        try {
          const { totalClaimed, claimCount } = JSON.parse(savedStats)
          setTotalGDollarsClaimed(totalClaimed || 0)
          setGDollarClaimCount(claimCount || 0)
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
        console.log('🔵 G$ History: Fetching real claim history from blockchain...')
        
        // Calculate starting block (approximately 6 months ago to avoid timeout)
        // Celo has ~5 second block times, so 6 months ≈ 180 days * 24 hours * 60 minutes * 12 blocks/minute
        const currentBlock = await publicClient.getBlockNumber()
        const blocksPerDay = (24 * 60 * 60) / 5 // 5 second block time
        const sixMonthsAgo = currentBlock - BigInt(Math.floor(blocksPerDay * 180))
        
        console.log('📊 G$ History: Querying from block', sixMonthsAgo.toString(), 'to current block')
        
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

        console.log('📊 G$ History: Found', logs.length, 'G$ claim transactions')

        let totalClaimed = 0
        let claimCount = logs.length
        const gDollarEarnings: Earning[] = []

        // Process each claim transaction
        for (const log of logs) {
          const amount = Number(formatEther(log.args.value as bigint))
          totalClaimed += amount

          // Get transaction details for timestamp
          const tx = await publicClient.getTransaction({ hash: log.transactionHash! })
          const block = await publicClient.getBlock({ blockNumber: tx.blockNumber! })
          const date = new Date(Number(block.timestamp) * 1000).toLocaleDateString()

          // Add to earnings history
          gDollarEarnings.push({
            id: `g$-claim-${log.transactionHash}`,
            type: "g_dollar_ubi",
            amount: amount,
            date: date,
            status: "completed",
            description: `G$ UBI Claim - Universal Basic Income`,
            collectionId: log.transactionHash
          })

          console.log('💰 G$ Claim found:', {
            amount: amount.toFixed(6),
            date,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber
          })
        }

        console.log('✅ G$ History: Total claimed:', totalClaimed.toFixed(6), 'G$ across', claimCount, 'claims')

        // Update state with real blockchain data
        setTotalGDollarsClaimed(totalClaimed)
        setGDollarClaimCount(claimCount)

        // Add G$ earnings to earnings history (prepend to existing)
        setEarnings(prev => [...gDollarEarnings.reverse(), ...prev.filter(e => e.type !== "g_dollar_ubi")])

        // Update localStorage with real data
        if (typeof window !== 'undefined') {
          const stats = {
            totalClaimed: totalClaimed,
            claimCount: claimCount
          }
          localStorage.setItem(`gDollarStats_${address}`, JSON.stringify(stats))
        }

      } catch (error) {
        console.error('❌ G$ History: Failed to fetch G$ claim history:', error)
        
        // If it's a timeout or network error, inform the user but don't crash
        if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('took too long'))) {
          console.log('⚠️ G$ History: Query timed out, this is normal for new accounts')
          // Don't show error toast for timeouts, as this is expected for accounts with no G$ history
        } else {
          console.error('❌ G$ History: Unexpected error:', error)
        }
        
        // Fall back to localStorage data if blockchain query fails
        if (typeof window !== 'undefined' && address) {
          const savedStats = localStorage.getItem(`gDollarStats_${address}`)
          if (savedStats) {
            try {
              const { totalClaimed, claimCount } = JSON.parse(savedStats)
              setTotalGDollarsClaimed(totalClaimed || 0)
              setGDollarClaimCount(claimCount || 0)
              console.log('📱 G$ History: Using localStorage data:', { totalClaimed, claimCount })
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
  }, [address, publicClient])  // Only run when address or publicClient changes

  // Save G$ claim statistics to localStorage when they change  
  useEffect(() => {
    if (typeof window !== 'undefined' && address && (totalGDollarsClaimed > 0 || gDollarClaimCount > 0)) {
      const stats = {
        totalClaimed: totalGDollarsClaimed,
        claimCount: gDollarClaimCount
      }
      localStorage.setItem(`gDollarStats_${address}`, JSON.stringify(stats))
    }
  }, [address, totalGDollarsClaimed, gDollarClaimCount])

  // Check if user is registered as collector
  useEffect(() => {
    async function checkRegistration() {
      if (!address || !publicClient) return
      
      try {
        // Get COLLECTOR_ROLE constant from contract
        const COLLECTOR_ROLE = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: [
            {
              inputs: [],
              name: "COLLECTOR_ROLE",
              outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'COLLECTOR_ROLE'
        }) as `0x${string}`
        
        // Check if user has COLLECTOR_ROLE
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
          args: [COLLECTOR_ROLE, address]
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
  }, [address, publicClient, isConnected])

  // Handle collector registration
  const handleRegisterCollector = useCallback(async () => {
    if (!address || !africycle) {
      toast.error("Please connect your wallet")
      return
    }
    
    try {
      setIsRegistering(true)
      
      // Register as collector with default info
      const txHash = await africycle.registerCollector(
        address,
        "Collector User", // Default name
        "Lagos, Nigeria", // Default location
        "collector@africycle.com" // Default contact
      )
      
      toast.success(`Registration successful! Transaction hash: ${txHash}`)
      
      // Wait a bit then check registration status
      setTimeout(() => {
        setIsRegistered(true)
      }, 3000)
      
    } catch (error) {
      console.error("Error registering collector:", error)
      toast.error("Registration failed. Please try again.")
    } finally {
      setIsRegistering(false)
    }
  }, [address, africycle])

  // Handle verification flow for non-whitelisted users
  const handleVerification = useCallback(async () => {
    console.log('🔵 G$ UBI Verification: Starting verification flow...')
    console.log('🔵 G$ UBI Verification: IdentitySDK available:', !!identitySDK)
    
    if (!identitySDK) {
      console.log('❌ G$ UBI Verification: No IdentitySDK available')
      toast.error("G$ SDK not initialized")
      return
    }

    setIsGeneratingLink(true)

    try {
      console.log('🔵 G$ UBI Verification: Generating Face Verification link...')
      const fvLink = await identitySDK.generateFVLink(
        false, // popup mode
        `${window.location.origin}/dashboard/collector/wallet`, // callback URL
        chainId // current chain ID
      )
      
      console.log('✅ G$ UBI Verification: Face Verification link generated successfully')
      
      // Store verification link in state so user can click on it
      setVerificationLink(fvLink)
      
      toast.success("Verification link generated! Click the link below to proceed.")
    } catch (error) {
      console.error('❌ G$ UBI Verification: Failed to generate verification link:', error)
      console.error('❌ G$ UBI Verification: Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      })
      toast.error("Failed to start verification process. Please try again.")
    } finally {
      setIsGeneratingLink(false)
    }
  }, [identitySDK, chainId])

  // Claim G$ UBI function
  const handleClaimUBI = useCallback(async () => {
    console.log('🔵 G$ UBI Claim: Starting claim process...')
    console.log('🔵 G$ UBI Claim: ClaimSDK available:', !!claimSDK)
    
    if (!claimSDK) {
      console.log('❌ G$ UBI Claim: No ClaimSDK available')
      toast.error("G$ SDK not initialized")
      return
    }

    setIsClaiming(true)
    console.log('🔵 G$ UBI Claim: Attempting to claim...')
    
    try {
      const claimResult = await claimSDK.claim()
      console.log('✅ G$ UBI Claim: Claim successful!', claimResult)
      
      // Get the claimed amount from the transaction logs or use the entitlement amount
      const claimedAmount = gDollarEntitlement > 0 ? formatEther(gDollarEntitlement) : "0"
      
      // Add to transaction history
      const newTransaction: TransactionProps = {
        type: "Deposit",
        description: "G$ UBI Claim",
        amount: `${claimedAmount} G$`,
        date: new Date().toLocaleDateString(),
        hash: claimResult.transactionHash
      }
      setTransactions(prev => [newTransaction, ...prev])
      
      // Add to earnings history
      const newEarning: Earning = {
        id: `g$-claim-${Date.now()}`,
        type: "g_dollar_ubi",
        amount: parseFloat(claimedAmount),
        date: new Date().toLocaleDateString(),
        status: "completed",
        description: `G$ UBI Claim - Universal Basic Income`,
        collectionId: claimResult.transactionHash
      }
      setEarnings(prev => [newEarning, ...prev])
      
      // Update G$ claim tracking
      setTotalGDollarsClaimed(prev => prev + parseFloat(claimedAmount))
      setGDollarClaimCount(prev => prev + 1)
      
      toast.success(`G$ UBI claimed successfully! Received ${claimedAmount} G$`)
      
      // Refresh entitlement data
      console.log('🔵 G$ UBI Claim: Refreshing entitlement after claim...')
      const entitlement = await claimSDK.checkEntitlement()
      console.log('📊 G$ UBI Claim: New entitlement:', {
        entitlement: entitlement.toString(),
        entitlementInEther: formatEther(entitlement)
      })
      setGDollarEntitlement(entitlement)
      
      console.log('🔵 G$ UBI Claim: Checking new next claim time...')
      const nextClaim = await claimSDK.nextClaimTime()
      console.log('📊 G$ UBI Claim: New next claim time:', nextClaim)
      setNextClaimTime(nextClaim)
    } catch (error) {
      console.error('❌ G$ UBI Claim: Claim failed:', error)
      console.error('❌ G$ UBI Claim: Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      })
      toast.error("Failed to claim G$ UBI. Please try again.")
    } finally {
      setIsClaiming(false)
      console.log('🔵 G$ UBI Claim: Claim process completed')
    }
  }, [claimSDK, gDollarEntitlement])

  // Memoize the withdraw handler
  const handleWithdraw = useCallback(async () => {
    if (!address || !africycle) {
      toast.error("Please connect your wallet")
      return
    }
    
    if (!isRegistered) {
      toast.error("Please register as a collector first")
      return
    }
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    
    try {
      setIsWithdrawing(true)
      
      // Convert amount to wei (bigint)
      const amountInWei = BigInt(Math.floor(parseFloat(withdrawAmount) * 1e18))
      
      // Debug: Check actual earnings in contract
      console.log("Debug - Checking contract state before withdrawal...")
      
      if (!publicClient) {
        toast.error("Unable to verify earnings. Please try again.")
        setIsWithdrawing(false)
        return
      }
      
      try {
        // Get collector-specific stats directly from contract
        const collectorStats = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: [
            {
              inputs: [{ internalType: "address", name: "_collector", type: "address" }],
              name: "getCollectorStats",
              outputs: [
                { internalType: "uint256", name: "collectorTotalCollected", type: "uint256" },
                { internalType: "uint256", name: "totalEarnings", type: "uint256" },
                { internalType: "uint256", name: "reputationScore", type: "uint256" },
                { internalType: "uint256[4]", name: "collectedByType", type: "uint256[4]" }
              ],
              stateMutability: "view",
              type: "function"
            }
          ],
          functionName: 'getCollectorStats',
          args: [address]
        }) as [bigint, bigint, bigint, [bigint, bigint, bigint, bigint]]
        
        const actualEarnings = collectorStats[1] // totalEarnings from collector stats
        console.log("Debug - Actual collector earnings from getCollectorStats:", actualEarnings.toString())
        console.log("Debug - Trying to withdraw:", amountInWei.toString())
        console.log("Debug - UI showing earnings:", collectorEarnings.toString())
        console.log("Debug - Collector total collected:", collectorStats[0].toString())
        console.log("Debug - Collector reputation score:", collectorStats[2].toString())
        
        // Check contract's cUSD balance
        const contractCusdBalance = await publicClient.readContract({
          address: CUSD_TOKEN_ADDRESS,
          abi: erc20ABI,
          functionName: 'balanceOf',
          args: [CONTRACT_ADDRESS]
        }) as bigint
        console.log("Debug - Contract cUSD balance:", contractCusdBalance.toString())
        console.log("Debug - Contract balance in cUSD:", formatEther(contractCusdBalance))
        
        if (actualEarnings === BigInt(0)) {
          toast.error("You have no earnings to withdraw. You need to complete waste collections first.")
          setIsWithdrawing(false)
          return
        }
        
        if (amountInWei > actualEarnings) {
          toast.error(`Insufficient earnings. You have ${formatEther(actualEarnings)} cUSD available.`)
          setIsWithdrawing(false)
          return
        }
        
        if (contractCusdBalance < amountInWei) {
          toast.error(`Contract has insufficient funds. Contract balance: ${formatEther(contractCusdBalance)} cUSD, needed: ${formatEther(amountInWei)} cUSD. Please try again later or contact support.`)
          setIsWithdrawing(false)
          return
        }
        
      } catch (profileError) {
        console.error("Error checking collector stats:", profileError)
        toast.error("Failed to verify earnings. You may not have any earnings yet.")
        setIsWithdrawing(false)
        return
      }
      
      // Check if user has enough earnings (from our local state)
      if (amountInWei > collectorEarnings) {
        toast.error("Insufficient earnings")
        setIsWithdrawing(false)
        return
      }
      
      // Call the withdraw function with correct parameters
      const txHash = await africycle.withdrawCollectorEarnings(address, amountInWei)
      
      toast.success(`Withdrawal successful! Transaction hash: ${txHash}`)
      
      // Reset form and refresh data
      setWithdrawAmount("")
      
      // Refresh user data after successful withdrawal
      setTimeout(async () => {
        if (africycle && address) {
          const stats = await africycle.getUserDetailedStats(address)
          setUserStats(stats)
          setCollectorEarnings(stats.totalEarnings)
        }
      }, 2000) // Wait 2 seconds for transaction to be mined
      
    } catch (error) {
      console.error("Error withdrawing funds:", error)
      
      // Better error handling
      if (error instanceof Error) {
        if (error.message.includes("Caller is not a collector")) {
          toast.error("You need to register as a collector first.")
          setIsRegistered(false)
        } else if (error.message.includes("Insufficient balance")) {
          toast.error("Insufficient earnings to withdraw.")
        } else if (error.message.includes("Insufficient contract balance")) {
          toast.error("The contract doesn't have enough funds. Please try again later or contact support.")
        } else if (error.message.includes("User is suspended")) {
          toast.error("Your account is suspended. Contact support.")
        } else if (error.message.includes("User is blacklisted")) {
          toast.error("Your account is blacklisted. Contact support.")
        } else if (error.message.includes("execution reverted") || error.message.includes("Contract call failed")) {
          toast.error("Transaction failed. This might be due to insufficient contract funds or network issues. Please try again later.")
        } else {
          toast.error(`Withdrawal failed: ${error.message}`)
        }
      } else {
        toast.error("Withdrawal failed. Please try again.")
      }
    } finally {
      setIsWithdrawing(false)
    }
  }, [address, africycle, withdrawAmount, collectorEarnings, isRegistered, publicClient])

  // Fetch user stats and earnings data
  useEffect(() => {
    async function fetchUserData() {
      if (!address || !africycle) return
      
      try {
        setLoading(true)
        
        // Fetch user detailed stats
        const stats = await africycle.getUserDetailedStats(address)
        setUserStats(stats)
        setCollectorEarnings(stats.totalEarnings)
        
        // Get user's collections to create earnings history
        // Note: We'll need to implement a way to get user's collections
        // For now, we'll create earnings based on the stats
        const collectionEarnings: Earning[] = []
        
        // If user has earnings, create a basic earnings entry
        if (stats.totalEarnings > 0) {
          collectionEarnings.push({
            id: "total-earnings",
            type: "collection",
            amount: parseFloat(formatEther(stats.totalEarnings)),
            date: new Date().toLocaleDateString(),
            status: "completed",
            description: "Total collection earnings"
          })
        }
        
        setEarnings(collectionEarnings)
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast.error("Failed to fetch user data")
      } finally {
        setLoading(false)
      }
    }
    
    if (isConnected) {
      fetchUserData()
    }
  }, [address, africycle, isConnected])

  // Separate effect for fetching balances
  useEffect(() => {
    async function fetchBalances() {
      if (!address || !publicClient) return
      
      try {
        // Fetch cUSD balance
        const cusdBalance = await publicClient.readContract({
          address: CUSD_TOKEN_ADDRESS,
          abi: erc20ABI,
          functionName: 'balanceOf',
          args: [address]
        }) as bigint
        setCusdBalance(cusdBalance)
        
        // Fetch contract's cUSD balance to check if withdrawals are possible
        const contractCusdBalance = await publicClient.readContract({
          address: CUSD_TOKEN_ADDRESS,
          abi: erc20ABI,
          functionName: 'balanceOf',
          args: [CONTRACT_ADDRESS]
        }) as bigint
        setContractBalance(contractCusdBalance)
      } catch (error) {
        console.error("Error fetching balances:", error)
      }
    }
    
    fetchBalances()
  }, [address, publicClient])

  // Separate effect for fetching transactions
  useEffect(() => {
    async function fetchTransactions() {
      if (!address || !publicClient) return
      
      try {
        const blockNumber = await publicClient.getBlockNumber()
        
        // Only fetch new transactions if we haven't fetched this block yet
        if (lastFetchedBlock && blockNumber <= lastFetchedBlock) {
          return
        }
        
        // Fetch recent transactions from the last 1000 blocks
        const logs = await publicClient.getLogs({
          address: CUSD_TOKEN_ADDRESS,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', name: 'from', indexed: true },
              { type: 'address', name: 'to', indexed: true },
              { type: 'uint256', name: 'value', indexed: false }
            ]
          },
          fromBlock: lastFetchedBlock || blockNumber - BigInt(1000),
          toBlock: blockNumber
        })
        
        if (logs.length > 0) {
          // Get blocks for all transactions to get timestamps
          const blocks = await Promise.all(
            logs.map(log => publicClient.getBlock({ blockHash: log.blockHash }))
          )
          
          // Filter transactions for this address
          const userTransactions = logs
            .filter(log => 
              log.args.from?.toLowerCase() === address.toLowerCase() || 
              log.args.to?.toLowerCase() === address.toLowerCase()
            )
            .map((log, index) => {
              const isReceiver = log.args.to?.toLowerCase() === address.toLowerCase()
              const isSender = log.args.from?.toLowerCase() === address.toLowerCase()
              const isFromContract = log.args.from?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
              
              // Determine transaction type based on source and destination
              let type: "Deposit" | "Withdrawal"
              let description: string
              
              if (isReceiver && isFromContract) {
                // Money received from contract = withdrawal of earnings
                type = "Withdrawal"
                description = "Earnings withdrawal"
              } else if (isReceiver && !isFromContract) {
                // Money received from another address = deposit
                type = "Deposit"
                description = "Received cUSD"
              } else if (isSender) {
                // Money sent to another address = withdrawal/transfer
                type = "Withdrawal"
                description = "Sent cUSD"
              } else {
                // Fallback
                type = isReceiver ? "Deposit" : "Withdrawal"
                description = isReceiver ? "Received cUSD" : "Sent cUSD"
              }
              
              return {
                type,
                description,
                amount: formatEther(log.args.value || BigInt(0)),
                date: new Date(Number(blocks[index].timestamp) * 1000).toLocaleDateString(),
                hash: log.transactionHash
              }
            })
            .reverse() // Most recent first

          // Update transactions, ensuring no duplicates by transaction hash
          setTransactions(prev => {
            const existingHashes = new Set(prev.map(tx => tx.hash))
            const uniqueNewTransactions = userTransactions.filter(tx => !existingHashes.has(tx.hash))
            return [...uniqueNewTransactions, ...prev]
          })
          
          setLastFetchedBlock(blockNumber)
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }
    
    if (isConnected) {
      fetchTransactions()
      
      // Set up polling for new transactions every 30 seconds
      const interval = setInterval(fetchTransactions, 30000)
      return () => clearInterval(interval)
    }
  }, [address, publicClient, lastFetchedBlock, isConnected])

  // Memoize the transaction list
  const transactionList = useMemo(() => {
    if (loading) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Loading transactions...
        </div>
      )
    }
    
    if (transactions.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No transaction history available
        </div>
      )
    }
    
    return transactions.map((tx, i) => (
      <Transaction
        key={tx.hash || i}
        type={tx.type}
        description={tx.description}
        amount={tx.amount}
        date={tx.date}
      />
    ))
  }, [loading, transactions])

  const totalEarnings = userStats ? parseFloat(formatEther(userStats.totalEarnings)) : 0
  const pendingEarnings = earnings
    .filter(earning => earning.status === 'pending')
    .reduce((sum, earning) => sum + earning.amount, 0)

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
      setCollectorEarnings(stats.totalEarnings)
      
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

      // Refresh G$ UBI data
      if (claimSDK) {
        try {
          const entitlement = await claimSDK.checkEntitlement()
          setGDollarEntitlement(entitlement)
          
          const nextClaim = await claimSDK.nextClaimTime()
          setNextClaimTime(nextClaim)
        } catch (error) {
          console.error('Failed to refresh G$ UBI data:', error)
        }
      }
      
      toast.success("Data refreshed successfully")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh data")
    } finally {
      setLoading(false)
    }
  }, [address, africycle, publicClient, claimSDK])

  return (
    <DashboardShell>
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Wallet</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your recycling earnings and transactions</p>
        </div>

        {!isConnected ? (
          <Card className="p-4 sm:p-6 lg:p-8 text-center">
            <IconWallet className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2">Connect Your Wallet</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Connect your wallet to view your balance and transaction history
            </p>
            <Button className="w-full sm:w-auto">Connect Wallet</Button>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="rounded-lg bg-green-100 p-2 sm:p-3 shrink-0">
                    <IconCoin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{totalEarnings.toFixed(4)} cUSD</h3>
                  </div>
                </div>
              </Card>

              {/* G$ UBI Section */}
              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="rounded-lg bg-blue-100 p-2 sm:p-3 shrink-0">
                    <IconGift className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">G$ UBI Available</p>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                      {isCheckingWhitelist ? "Checking..." : formatEther(gDollarEntitlement)} G$
                    </h3>
                  </div>
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  {isInitializingSDK || isCheckingWhitelist ? (
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {isCheckingWhitelist ? "Checking eligibility..." : "Initializing G$ SDK..."}
                      </p>
                      <Button disabled className="w-full text-xs sm:text-sm bg-blue-600 hover:bg-blue-700">
                        <IconRefresh className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                        Loading...
                      </Button>
                    </div>
                  ) : !isWhitelisted ? (
                    <div className="text-center">
                      {!verificationLink ? (
                        <>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                            Complete identity verification to access G$ UBI
                          </p>
                          <Button 
                            onClick={handleVerification}
                            disabled={isGeneratingLink}
                            className="w-full text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                          >
                            {isGeneratingLink ? (
                              <>
                                <IconRefresh className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                                <span className="hidden sm:inline">Generating Link...</span>
                                <span className="sm:hidden">Generating...</span>
                              </>
                            ) : (
                              <>
                                <span className="hidden sm:inline">Generate Verification Link</span>
                                <span className="sm:hidden">Verify Identity</span>
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                            Click the link below to complete face verification:
                          </p>
                          <div className="space-y-2 sm:space-y-3">
                            <Button 
                              asChild
                              className="w-full text-xs sm:text-sm bg-green-600 hover:bg-green-700"
                            >
                              <a 
                                href={verificationLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center justify-center"
                              >
                                <IconGift className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="hidden sm:inline">Complete Face Verification</span>
                                <span className="sm:hidden">Verify Face</span>
                              </a>
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="w-full text-xs"
                              onClick={() => {
                                setVerificationLink(null)
                                toast.info("You can generate a new verification link")
                              }}
                            >
                              Generate New Link
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ) : gDollarEntitlement > 0 ? (
                    <Button 
                      onClick={handleClaimUBI}
                      disabled={isClaiming}
                      className="w-full text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                    >
                      {isClaiming ? "Claiming..." : (
                        <>
                          <span className="hidden sm:inline">Claim {formatEther(gDollarEntitlement)} G$ UBI</span>
                          <span className="sm:hidden">Claim G$ UBI</span>
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {nextClaimTime && nextClaimTime > new Date() ? 
                          countdown ? 
                            `Next claim in ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s` : 
                            "Claim available now!" : 
                          "No G$ UBI available at this time"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="rounded-lg bg-purple-100 p-2 sm:p-3 shrink-0">
                    <IconGift className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total G$ Claimed</p>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{totalGDollarsClaimed.toFixed(2)} G$</h3>
                    <p className="text-xs text-muted-foreground">{gDollarClaimCount} claims made</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-semibold">Recent Transactions</h3>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="w-full sm:w-auto">
                  <IconRefresh className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="text-xs sm:text-sm">Refresh</span>
                </Button>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {loading ? (
                  <div className="space-y-2 sm:space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-1 sm:mb-2"></div>
                        <div className="h-2 sm:h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  transactionList
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <IconWallet className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm sm:text-base">No transactions yet</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Earnings History */}
            <Card className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Earnings History</h3>
              <div className="space-y-2 sm:space-y-3">
                {earnings.length > 0 ? (
                  earnings.map((earning) => (
                    <EarningItem key={earning.id} earning={earning} />
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    <IconCoin className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm sm:text-base">No earnings history</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}