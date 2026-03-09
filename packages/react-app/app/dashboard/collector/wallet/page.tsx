"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useGoodDollar } from "@/hooks/useGoodDollar"
import { useRewardStreaming } from "@/hooks/useRewardStreaming"
import { useAccount, usePublicClient, useChainId, useBalance, useWalletClient } from "wagmi"
import { formatEther, parseEther, createPublicClient, http } from "viem"
import { celo } from 'viem/chains'

// G$ UBI SDK imports 
import { useRef } from "react"

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
const CUSD_TOKEN_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`
const MENTO_TOKENS = {
  cUSD: CUSD_TOKEN_ADDRESS,
  cNGN: "0xE2702Bd97ee33c88c8f6f92DA3B733608aa76F71" as `0x${string}`,
  cKES: "0x456a3D042C0DbD3db53D5489e98dFb038553B0d0" as `0x${string}`,
} as const

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
          className={`rounded-full p-1.5 sm:p-2 shrink-0 ${isDeposit ? "bg-green-100" : "bg-red-100"
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
          className={`text-sm sm:text-base font-medium ${isDeposit ? "text-green-600" : "text-red-600"
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
  const [walletStatus, setWalletStatus] = useState({
    loading: true,
    cusdBalance: BigInt(0),
    gDollarBalance: BigInt(0),
    isRegistered: false,
    isRegistering: false,
    isWithdrawing: false,
    collectorEarnings: BigInt(0),
    userStats: null as any,
    userProfile: null as any, // Added userProfile
    totalGDollarsClaimed: 0,
    gDollarClaimCount: 0,
  })

  const [formState, setFormState] = useState({
    withdrawAmount: "",
    phoneNumber: "",
    payoutToken: 'cUSD' as 'cUSD' | 'cNGN' | 'cKES',
    slippageBps: 50,
  })

  const [historyData, setHistoryData] = useState({
    transactions: [] as TransactionProps[],
    earnings: [] as Earning[],
    lastFetchedBlock: null as bigint | null,
  })

  // Initialize G$ Hook
  const { data: walletClient } = useWalletClient()
  const gDollar = useGoodDollar({
    address,
    publicClient,
    walletClient,
    chainId
  })

  // Use the countdown hook
  const countdown = useCountdown(gDollar.nextClaimTime)

  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })

  // Initialize Reward Streaming Hook
  const streaming = useRewardStreaming({
    address,
    publicClient,
    walletClient,
    chainId,
    receiver: CONTRACT_ADDRESS,
  })

  // Memoize the formatted balances
  const formattedBalances = useMemo(() => ({
    cusd: formatEther(walletStatus.cusdBalance),
    earnings: balance ? formatEther(balance.value) : "0"
  }), [walletStatus.cusdBalance, balance])

  // Memoize the copy to clipboard function
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Address copied to clipboard")
  }, [])


  // Fetch G$ claim history and stats
  useEffect(() => {
    const fetchGDollarClaimHistory = async () => {
      if (!address || !publicClient) return

      try {
        console.log('🔵 G$ History: Fetching real claim history from blockchain...')

        const currentBlock = await publicClient.getBlockNumber()
        const blocksPerDay = (24 * 60 * 60) / 5 // 5 second block time
        const sixMonthsAgo = currentBlock - BigInt(Math.floor(blocksPerDay * 180))

        console.log('📊 G$ History: Querying from block', sixMonthsAgo.toString(), 'to current block')

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

        for (const log of logs) {
          const amount = Number(formatEther(log.args.value as bigint))
          totalClaimed += amount

          const tx = await publicClient.getTransaction({ hash: log.transactionHash! })
          const block = await publicClient.getBlock({ blockNumber: tx.blockNumber! })
          const date = new Date(Number(block.timestamp) * 1000).toLocaleDateString()

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

        setWalletStatus(prev => ({
          ...prev,
          totalGDollarsClaimed: totalClaimed,
          gDollarClaimCount: claimCount
        }))

        setHistoryData(prev => ({
          ...prev,
          earnings: [...gDollarEarnings.reverse(), ...prev.earnings.filter(e => e.type !== "g_dollar_ubi")]
        }))

      } catch (error) {
        console.error('❌ G$ History: Failed to fetch G$ claim history:', error)

        if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('took too long'))) {
          console.log('⚠️ G$ History: Query timed out, this is normal for new accounts')
        } else {
          console.error('❌ G$ History: Unexpected error:', error)
        }
      }
    }

    if (address && publicClient) {
      fetchGDollarClaimHistory()
    }
  }, [address, publicClient])

  // Check if user is registered as collector
  useEffect(() => {
    async function checkRegistration() {
      if (!address || !publicClient) return

      try {
        console.log('DEBUG: Registration check started for', address)
        const COLLECTOR_ROLE = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: [{ inputs: [], name: "COLLECTOR_ROLE", outputs: [{ type: "bytes32" }], stateMutability: "view", type: "function" }],
          functionName: 'COLLECTOR_ROLE'
        }) as `0x${string}`

        console.log('DEBUG: COLLECTOR_ROLE:', COLLECTOR_ROLE)

        const hasRole = await publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: [{ inputs: [{ type: "bytes32", name: "role" }, { type: "address", name: "account" }], name: "hasRole", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" }],
          functionName: 'hasRole',
          args: [COLLECTOR_ROLE, address]
        }) as boolean

        console.log('DEBUG: Registration status (hasRole):', hasRole)
        setWalletStatus(prev => ({ ...prev, isRegistered: hasRole }))
      } catch (error) {
        console.error("DEBUG: Error checking registration:", error)
      }
    }

    if (isConnected) checkRegistration()
  }, [address, publicClient, isConnected])

  // Handle collector registration
  const handleRegisterCollector = useCallback(async () => {
    if (!address || !africycle) {
      toast.error("Please connect your wallet")
      return
    }

    try {
      setWalletStatus(prev => ({ ...prev, isRegistering: true }))
      const txHash = await africycle.registerCollector(address, "Collector User", "Lagos, Nigeria", "collector@africycle.com")
      toast.success(`Registration successful!`)
      setWalletStatus(prev => ({ ...prev, isRegistered: true }))
    } catch (error) {
      console.error("Error registering collector:", error)
      toast.error("Registration failed")
    } finally {
      setWalletStatus(prev => ({ ...prev, isRegistering: false }))
    }
  }, [address, africycle])

  const handleRefresh = useCallback(async () => {
    if (!address || !africycle) return

    try {
      setWalletStatus(prev => ({ ...prev, loading: true }))

      const stats = await africycle.getUserDetailedStats(address)
      const cusd = await publicClient?.readContract({
        address: CUSD_TOKEN_ADDRESS,
        abi: erc20ABI,
        functionName: 'balanceOf',
        args: [address]
      })

      setWalletStatus(prev => ({
        ...prev,
        userStats: stats,
        collectorEarnings: stats.totalEarnings,
        cusdBalance: (cusd as bigint) || prev.cusdBalance
      }))

      toast.success("Updated")
    } catch (error) {
      console.error("Refresh failed:", error)
    } finally {
      setWalletStatus(prev => ({ ...prev, loading: false }))
    }
  }, [address, africycle, publicClient])

  // Handle verification flow
  const handleVerification = useCallback(async () => {
    await gDollar.handleVerify()
  }, [gDollar])

  // Claim G$ UBI function
  const handleClaimUBI = useCallback(async () => {
    const claimRes = await gDollar.handleClaim()
    if (claimRes?.success) {
      handleRefresh()
      // Manually inject the new claim into the history
      if (claimRes.amount > 0) {
        setHistoryData(prev => ({
          ...prev,
          earnings: [{
            id: `g$-claim-manual-${Date.now()}`,
            type: "g_dollar_ubi",
            amount: claimRes.amount,
            date: new Date().toLocaleDateString(),
            status: "completed",
            description: `G$ UBI Claim - Universal Basic Income`,
          }, ...prev.earnings]
        }))
        setWalletStatus(prev => ({
          ...prev,
          totalGDollarsClaimed: prev.totalGDollarsClaimed + claimRes.amount,
          gDollarClaimCount: prev.gDollarClaimCount + 1
        }))
      }
    }
  }, [gDollar, handleRefresh])

  // Handle Reward Stream Sync
  const handleSyncStream = useCallback(async () => {
    if (!address || !streaming) return

    const performanceTier = getTierInfo(Number(walletStatus.userProfile?.totalCollected || BigInt(0)))

    // Calculate flow rate based on multiplier
    // Base rate: 100 G$ per month
    const baseMonthlyAmount = 100
    const tieredMonthlyAmount = baseMonthlyAmount * performanceTier.multiplier
    const flowRate = streaming.perMonthToFlowRate(tieredMonthlyAmount)

    toast.promise(
      streaming.syncStream(address, flowRate),
      {
        loading: 'Syncing G$ Reward Stream...',
        success: (data) => {
          streaming.refetch()
          return `Stream synced! Tier: ${performanceTier.name} (${performanceTier.multiplier}x)`
        },
        error: (err) => `Sync failed: ${err.message || 'Unknown error'}`
      }
    )
  }, [address, streaming, walletStatus.userProfile, CONTRACT_ADDRESS])

  const handleWithdraw = useCallback(async () => {
    if (!address || !africycle) return toast.error("Please connect wallet")
    if (!walletStatus.isRegistered) return toast.error("Please register first")
    if (!formState.withdrawAmount || parseFloat(formState.withdrawAmount) <= 0) return toast.error("Invalid amount")
    if (formState.payoutToken !== 'cUSD') return toast.info("Local stablecoin support coming soon")

    try {
      setWalletStatus(prev => ({ ...prev, isWithdrawing: true }))
      const amountInWei = BigInt(Math.floor(parseFloat(formState.withdrawAmount) * 1e18))

      if (amountInWei > walletStatus.collectorEarnings) return toast.error("Insufficient earnings")

      const txHash = await africycle.withdrawCollectorEarnings(address, amountInWei)
      toast.success(`Withdrawal successful!`)
      setFormState(prev => ({ ...prev, withdrawAmount: "" }))
      handleRefresh()
    } catch (error) {
      console.error("Withdrawal failed:", error)
      toast.error("Withdrawal failed")
    } finally {
      setWalletStatus(prev => ({ ...prev, isWithdrawing: false }))
    }
  }, [address, africycle, formState, walletStatus, handleRefresh])

  useEffect(() => {
    async function fetchUserData() {
      if (!address || !africycle) return

      try {
        setWalletStatus(prev => ({ ...prev, loading: true }))

        const [stats, profile] = await Promise.all([
          africycle.getUserDetailedStats(address),
          africycle.getUserProfile(address)
        ])

        setWalletStatus(prev => ({
          ...prev,
          userStats: stats,
          userProfile: profile,
          collectorEarnings: stats.totalEarnings
        }))

        if (stats.totalEarnings > 0) {
          setHistoryData(prev => ({
            ...prev,
            earnings: [{
              id: "total-earnings",
              type: "collection",
              amount: parseFloat(formatEther(stats.totalEarnings)),
              date: new Date().toLocaleDateString(),
              status: "completed",
              description: "Total collection earnings"
            }]
          }))
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setWalletStatus(prev => ({ ...prev, loading: false }))
      }
    }

    if (isConnected) {
      fetchUserData()
    }
  }, [address, africycle, isConnected])

  useEffect(() => {
    async function fetchBalances() {
      if (!address || !publicClient) return

      try {
        const [cusd, gDollar] = await Promise.all([
          publicClient.readContract({
            address: CUSD_TOKEN_ADDRESS,
            abi: erc20ABI,
            functionName: "balanceOf",
            args: [address]
          }),
          publicClient.readContract({
            address: G_DOLLAR_TOKEN_ADDRESS,
            abi: erc20ABI,
            functionName: "balanceOf",
            args: [address]
          })
        ])

        setWalletStatus(prev => ({
          ...prev,
          cusdBalance: cusd as bigint,
          gDollarBalance: gDollar as bigint
        }))
      } catch (error) {
        console.error("Error fetching balances:", error)
      }
    }

    fetchBalances()
  }, [address, publicClient])

  useEffect(() => {
    async function fetchTransactions() {
      if (!address || !publicClient) return

      try {
        const blockNumber = await publicClient.getBlockNumber()

        if (historyData.lastFetchedBlock && blockNumber <= historyData.lastFetchedBlock) {
          return
        }

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
          fromBlock: historyData.lastFetchedBlock || blockNumber - BigInt(1000),
          toBlock: blockNumber
        })

        if (logs.length > 0) {
          const blocks = await Promise.all(
            logs.map(log => publicClient.getBlock({ blockHash: log.blockHash }))
          )

          const userTransactions = logs
            .filter(log =>
              log.args.from?.toLowerCase() === address.toLowerCase() ||
              log.args.to?.toLowerCase() === address.toLowerCase()
            )
            .map((log, index) => {
              const isReceiver = log.args.to?.toLowerCase() === address.toLowerCase()
              const isFromContract = log.args.from?.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()

              let type: "Deposit" | "Withdrawal"
              let description: string

              if (isReceiver && isFromContract) {
                type = "Withdrawal"
                description = "Earnings withdrawal"
              } else {
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
            .reverse()

          setHistoryData(prev => {
            const existingHashes = new Set(prev.transactions.map(tx => tx.hash))
            const uniqueNew = userTransactions.filter(tx => !existingHashes.has(tx.hash))
            return {
              ...prev,
              transactions: [...uniqueNew, ...prev.transactions],
              lastFetchedBlock: blockNumber
            }
          })
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
      }
    }

    if (isConnected) {
      fetchTransactions()
      const interval = setInterval(fetchTransactions, 30000)
      return () => clearInterval(interval)
    }
  }, [address, publicClient, historyData.lastFetchedBlock, isConnected])

  const transactionList = useMemo(() => {
    if (walletStatus.loading) {
      return <div className="py-8 text-center text-muted-foreground">Loading transactions...</div>
    }

    const allActivity = [
      ...historyData.transactions.map(tx => ({ ...tx, sortDate: new Date(tx.date).getTime(), isTransaction: true as const })),
      ...historyData.earnings.map(earn => ({ ...earn, sortDate: new Date(earn.date).getTime(), isTransaction: false as const }))
    ].sort((a, b) => b.sortDate - a.sortDate)

    if (allActivity.length === 0) {
      return <div className="py-8 text-center text-muted-foreground">No transactions available</div>
    }

    return allActivity.map((item, i) => (
      item.isTransaction
        ? <Transaction key={item.hash || i} type={item.type as "Deposit" | "Withdrawal"} description={item.description} amount={item.amount as string} date={item.date} hash={item.hash as string} />
        : <EarningItem key={item.id || i} earning={item as any} />
    ))
  }, [walletStatus.loading, historyData.transactions, historyData.earnings])

  const totalEarnings = parseFloat(formatEther(walletStatus.collectorEarnings))
  const pendingEarnings = historyData.earnings
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0)


  return (
    <DashboardShell>
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <Header />

        {!isConnected ? (
          <ConnectWalletCard />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <BalanceCard
                title="Total Earnings"
                amount={parseFloat(formatEther(walletStatus.collectorEarnings))}
                unit="cUSD"
                icon={<IconCoin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />}
              />
              <PerformanceTierCard
                totalWeight={walletStatus.userProfile?.totalCollected || BigInt(0)}
                collectedByType={walletStatus.userStats?.collected}
              />
              <G_DollarUBICard gDollar={gDollar} countdown={countdown} handleClaim={handleClaimUBI} handleVerify={handleVerification} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <BalanceCard
                title="cUSD Balance"
                amount={parseFloat(formatEther(walletStatus.cusdBalance))}
                unit="cUSD"
                icon={<IconWallet className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />}
                bgColor="bg-purple-100"
                action={<Button variant="ghost" size="sm" onClick={() => copyToClipboard(address || "")}><IconCopy className="h-4 w-4" /></Button>}
              />
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl border-none col-span-1 md:col-span-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-white/20 p-2.5 shadow-inner">
                    <IconRefresh className="h-6 w-6 opacity-60" />
                  </div>
                  <div>
                    <p className="text-sm font-bold opacity-90 uppercase tracking-tight">G$ Streaming Rewards</p>
                    <p className="text-xs font-medium text-blue-100">Performance-Based Incentives</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-4 gap-3">
                  <div className="px-4 py-2 rounded-full bg-white/15 border border-white/30 backdrop-blur-sm">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/90">⚡ Integrating Soon</span>
                  </div>
                  <p className="text-center text-xs text-white/70 max-w-[220px]">
                    Earn G$ rewards streamed directly to your wallet based on your recycling tier.
                  </p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <WithdrawalCard
                formState={formState}
                setFormState={setFormState}
                walletStatus={walletStatus}
                handleWithdraw={handleWithdraw}
                isRegistered={walletStatus.isRegistered}
                handleRegisterCollector={handleRegisterCollector}
                isRegistering={walletStatus.isRegistering}
              />
              <HistoryCard transactionList={transactionList} handleRefresh={handleRefresh} walletStatus={walletStatus} />
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}

// --- Sub-components (Senior Engineer Refactor) ---

function Header() {
  return (
    <div className="mb-4 sm:mb-6">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Wallet</h1>
      <p className="text-sm sm:text-base text-muted-foreground">Manage your recycling earnings and transactions</p>
    </div>
  )
}

function ConnectWalletCard() {
  return (
    <Card className="p-4 sm:p-6 lg:p-8 text-center">
      <IconWallet className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
      <h3 className="text-base sm:text-lg font-semibold mb-2">Connect Your Wallet</h3>
      <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
        Connect your wallet to view your balance and transaction history
      </p>
      <Button className="w-full sm:w-auto">Connect Wallet</Button>
    </Card>
  )
}

function BalanceCard({ title, amount, unit, icon, bgColor, action }: any) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`rounded-lg ${bgColor} p-2 sm:p-3 shrink-0`}>
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{amount.toFixed(2)} {unit}</h3>
          </div>
        </div>
        {action}
      </div>
    </Card>
  )
}

function G_DollarUBICard({ gDollar, countdown, handleClaim, handleVerify }: any) {
  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="rounded-lg bg-blue-100 p-2 sm:p-3 shrink-0">
          <IconGift className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground">G$ UBI Available</p>
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
            {gDollar.isCheckingWhitelist ? "Checking..." : parseFloat(formatEther(gDollar.entitlement)).toFixed(1)} G$
          </h3>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {gDollar.isInitializing || gDollar.isCheckingWhitelist ? (
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              {gDollar.isCheckingWhitelist ? "Checking eligibility..." : "Initializing G$ SDK..."}
            </p>
            <Button disabled className="w-full text-xs sm:text-sm bg-blue-600 hover:bg-blue-700">
              <IconRefresh className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
              Loading...
            </Button>
          </div>
        ) : !gDollar.isWhitelisted ? (
          <div className="text-center">
            {!gDollar.verificationLink ? (
              <>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                  Complete identity verification to access G$ UBI
                </p>
                <Button
                  onClick={handleVerify}
                  disabled={gDollar.isGeneratingLink}
                  className="w-full text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                >
                  {gDollar.isGeneratingLink ? (
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
                      href={gDollar.verificationLink}
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
                      // This needs to call a function in the parent to clear the link
                      // For now, we'll simulate it or assume the parent handles it
                      // setVerificationLink(null)
                      toast.info("You can generate a new verification link")
                    }}
                  >
                    Generate New Link
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : gDollar.entitlement > 0 ? (
          <Button
            onClick={handleClaim}
            disabled={gDollar.isClaiming}
            className="w-full text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
          >
            {gDollar.isClaiming ? "Claiming..." : (
              <>
                <span className="hidden sm:inline">Claim {parseFloat(formatEther(gDollar.entitlement)).toFixed(1)} G$ UBI</span>
                <span className="sm:hidden">Claim G$ UBI</span>
              </>
            )}
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
              {gDollar.nextClaimTime && gDollar.nextClaimTime > new Date() ?
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
  )
}

function WithdrawalCard({ formState, setFormState, walletStatus, handleWithdraw, isRegistered, handleRegisterCollector, isRegistering }: any) {
  const { withdrawAmount, payoutToken } = formState;

  return (
    <Card className="flex flex-col">
      <div className="p-4 sm:p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Withdraw Funds</h3>
          <p className="text-sm text-muted-foreground">Transfer your earnings to your wallet or mobile money</p>
        </div>
        <IconArrowUp className="h-5 w-5 text-muted-foreground" />
      </div>

      {!isRegistered ? (
        <div className="p-6 text-center space-y-4">
          <IconWallet className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Register as a collector to start withdrawing your earnings.</p>
          <Button onClick={handleRegisterCollector} disabled={isRegistering} className="w-full">
            {isRegistering ? <IconRefresh className="animate-spin mr-2" /> : null}
            Register as Collector
          </Button>
        </div>
      ) : (
        <>
          <div className="p-4 sm:p-6 space-y-4 flex-1">
            <div className="space-y-2">
              <label className="text-sm font-medium">Payout Method</label>
              <Select value={payoutToken} onValueChange={(v) => setFormState((prev: any) => ({ ...prev, payoutToken: v as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cUSD">cUSD (Stablecoin)</SelectItem>
                  <SelectItem value="cNGN">cNGN (Nigerian Naira) - Soon</SelectItem>
                  <SelectItem value="cKES">cKES (Kenyan Shilling) - Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <label className="font-medium">Amount to Withdraw</label>
                <span className="text-muted-foreground">Available: {parseFloat(formatEther(walletStatus.collectorEarnings)).toFixed(2)} cUSD</span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setFormState((prev: any) => ({ ...prev, withdrawAmount: e.target.value }))}
                  className="pr-12"
                />
                <div className="absolute inset-y-0 right-3 flex items-center text-sm font-medium text-muted-foreground">
                  cUSD
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium text-green-600">Free (Gasless)</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm pt-2 border-t font-bold">
                <span>Total Payout</span>
                <span className="text-lg">{withdrawAmount || "0.00"} {payoutToken}</span>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 pt-0">
            <Button
              className="w-full"
              size="lg"
              onClick={handleWithdraw}
              disabled={walletStatus.isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
            >
              {walletStatus.isWithdrawing ? <IconRefresh className="animate-spin mr-2" /> : <IconArrowUp className="mr-2" />}
              Withdraw Now
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}

function HistoryCard({ transactionList, handleRefresh, walletStatus }: any) {
  return (
    <Card className="flex flex-col">
      <div className="p-4 sm:p-6 border-b flex items-center justify-between">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Activity History</h3>
          <p className="text-sm text-muted-foreground">Your recent transactions and earnings</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={walletStatus.loading}>
          <IconRefresh className={`h-4 w-4 ${walletStatus.loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      <div className="flex-1 overflow-auto max-h-[400px] lg:max-h-[600px]">
        <div className="p-2 sm:p-4">
          {transactionList}
        </div>
      </div>
    </Card>
  )
}

// --- Season 4: Performance Tiers (Based on Waste Collected) ---

function getTierInfo(weightKg: number) {
  if (weightKg >= 1000) return { name: "Platinum", color: "text-blue-600", bg: "bg-blue-100", fill: "bg-blue-500", border: "border-blue-200", multiplier: 2.5, next: null, emoji: "💎" }
  if (weightKg >= 200) return { name: "Gold", color: "text-amber-600", bg: "bg-amber-100", fill: "bg-amber-500", border: "border-amber-200", multiplier: 1.8, next: 1000, emoji: "🥇" }
  if (weightKg >= 50) return { name: "Silver", color: "text-slate-500", bg: "bg-slate-100", fill: "bg-slate-400", border: "border-slate-200", multiplier: 1.3, next: 200, emoji: "🥈" }
  return { name: "Bronze", color: "text-orange-600", bg: "bg-orange-100", fill: "bg-orange-500", border: "border-orange-200", multiplier: 1.0, next: 50, emoji: "🥉" }
}

function PerformanceTierCard({ totalWeight, collectedByType }: { totalWeight: bigint, collectedByType?: bigint[] }) {
  // Waste weights in the contract are simple integers (kg), not wei-scaled
  let weightKg = Number(totalWeight)

  // Fallback: sum up categories if total is missing
  if (weightKg === 0 && Array.isArray(collectedByType)) {
    weightKg = Number(collectedByType.reduce((acc, val) => acc + val, BigInt(0)))
  }

  const tier = getTierInfo(weightKg)
  const progress = tier.next ? Math.min((weightKg / tier.next) * 100, 100) : 100

  return (
    <Card className={`p-4 sm:p-6 border-2 ${tier.border} bg-gradient-to-br from-white to-slate-50`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`rounded-xl ${tier.bg} p-2 sm:p-3 text-2xl leading-none shadow-sm`}>
            {tier.emoji}
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">Performance Tier</p>
            <h3 className={`text-lg sm:text-xl font-black ${tier.color} leading-none`}>{tier.name}</h3>
          </div>
        </div>
        <Badge variant="outline" className={`${tier.border} ${tier.color} font-bold bg-white text-xs sm:text-sm px-2 sm:px-3 py-1`}>
          {tier.multiplier}x G$ Rate
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium text-muted-foreground">
          <span>{weightKg.toFixed(2)} kg Waste</span>
          {tier.next ? <span>Next: {tier.next} kg</span> : <span>Max tier reached! ✨</span>}
        </div>
        <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${tier.fill}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {tier.next && (
          <p className="text-xs text-muted-foreground">
            {(tier.next - weightKg).toFixed(2)}kg more to reach {getTierInfo(tier.next).name}
          </p>
        )}
      </div>
    </Card>
  )
}

// --- Season 4: Real-time G$ Streaming Counter (Superfluid math) ---
// amount(t) = totalAccruedAtFlowStart + flowRate × (now - lastUpdated)

function StreamingCounter({
  flowRatePerSecond,
  totalAccruedSinceStart,
  isActive,
}: {
  flowRatePerSecond: bigint
  totalAccruedSinceStart: bigint
  isActive: boolean
}) {
  // Re-compute every 100ms using Superfluid's exact formula
  const [display, setDisplay] = useState(() =>
    formatEther(totalAccruedSinceStart)
  )

  useEffect(() => {
    if (!isActive || flowRatePerSecond === BigInt(0)) {
      setDisplay(formatEther(totalAccruedSinceStart))
      return
    }

    // We know the chain told us totalAccruedSinceStart was correct at fetchTime.
    // We track fetchTime in ms so we can extrapolate forward.
    const fetchTimeMs = Date.now()
    const baseAmount = totalAccruedSinceStart

    const tick = () => {
      const elapsedSec = BigInt(Math.floor((Date.now() - fetchTimeMs) / 1000))
      const extraAccrued = flowRatePerSecond * elapsedSec
      const total = baseAmount + extraAccrued
      // Show 8 decimal places for satisfying live counter UX
      const formatted = parseFloat(formatEther(total)).toFixed(8)
      setDisplay(formatted)
    }

    tick()
    const interval = setInterval(tick, 100)
    return () => clearInterval(interval)
  }, [flowRatePerSecond, totalAccruedSinceStart, isActive])

  if (!isActive) {
    return (
      <div className="text-xl font-semibold opacity-60 mt-1">
        No active stream
      </div>
    )
  }

  return (
    <div className="font-mono font-bold text-2xl sm:text-3xl tracking-tighter tabular-nums mt-1">
      +{display} <span className="text-sm font-normal opacity-80">G$</span>
    </div>
  )
}