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
} from "@tabler/icons-react"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useAccount, usePublicClient, useChainId, useBalance } from "wagmi"
import { formatEther, parseEther, createPublicClient, http } from "viem"
import { celoAlfajores } from 'viem/chains'

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
  type: "Deposit" | "Withdrawal"
  description: string
  amount: string
  date: string
  hash?: string
}

interface Earning {
  id: string
  type: "collection" | "referral" | "bonus"
  amount: number
  date: string
  status: "completed" | "pending"
  description: string
  collectionId?: string
}

function Transaction({ type, description, amount, date }: TransactionProps) {
  const isDeposit = type === "Deposit"
  return (
    <div className="flex items-center justify-between border-b py-4 last:border-0">
      <div className="flex items-center gap-3">
        <div
          className={`rounded-full p-2 ${
            isDeposit ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {isDeposit ? (
            <IconArrowDown
              className="h-4 w-4 text-green-600"
              style={{ transform: "rotate(45deg)" }}
            />
          ) : (
            <IconArrowUp
              className="h-4 w-4 text-red-600"
              style={{ transform: "rotate(45deg)" }}
            />
          )}
        </div>
        <div>
          <p className="font-medium">{type}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="text-right">
        <p
          className={`font-medium ${
            isDeposit ? "text-green-600" : "text-red-600"
          }`}
        >
          {isDeposit ? "+" : "-"}
          {amount}
        </p>
        <p className="text-sm text-muted-foreground">{date}</p>
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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    return status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  return (
    <div className="flex items-center justify-between border-b py-4 last:border-0">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-green-100 p-2">
          <IconCoin className="h-4 w-4 text-green-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium capitalize">{earning.type}</p>
            <Badge variant="secondary" className={`text-xs ${getTypeColor(earning.type)}`}>
              {earning.type}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{earning.description}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-green-600">+{earning.amount.toFixed(2)} cUSD</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">{earning.date}</p>
          <Badge variant="secondary" className={`text-xs ${getStatusColor(earning.status)}`}>
            {earning.status}
          </Badge>
        </div>
      </div>
    </div>
  )
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

  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })

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
            .map((log, index) => ({
              type: (log.args.to?.toLowerCase() === address.toLowerCase() ? "Deposit" : "Withdrawal") as "Deposit" | "Withdrawal",
              description: log.args.to?.toLowerCase() === address.toLowerCase() 
                ? "Received cUSD" 
                : "Sent cUSD",
              amount: formatEther(log.args.value || BigInt(0)),
              date: new Date(Number(blocks[index].timestamp) * 1000).toLocaleDateString(),
              hash: log.transactionHash
            }))
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
      
      toast.success("Data refreshed successfully")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh data")
    } finally {
      setLoading(false)
    }
  }, [address, africycle, publicClient])

  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          heading="Wallet"
          text="Manage your earnings and transactions"
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
            <div className="grid gap-4 md:grid-cols-1 max-w-md">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-3">
                    <IconCoin className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                    <h3 className="text-2xl font-bold">{totalEarnings.toFixed(4)} cUSD</h3>
                  </div>
                </div>
              </Card>
            </div>

            {/* Withdraw Earnings */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Withdraw Earnings</h3>
                {!isRegistered ? (
                  <div className="text-center py-8">
                    <IconWallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-medium mb-2">Register as Collector</h4>
                    <p className="text-muted-foreground mb-4">
                      You need to register as a collector to earn and withdraw funds
                    </p>
                    <Button 
                      onClick={handleRegisterCollector}
                      disabled={isRegistering}
                      className="w-full"
                    >
                      {isRegistering ? "Registering..." : "Register as Collector"}
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
                        max={totalEarnings}
                        step="0.01"
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || !withdrawAmount || totalEarnings <= 0}
                    >
                      {isWithdrawing ? "Processing..." : "Withdraw Earnings"}
                    </Button>
                    {totalEarnings <= 0 && (
                      <p className="text-sm text-muted-foreground text-center">
                        No earnings available to withdraw
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
                    <span className="text-muted-foreground">Collector Status:</span>
                    <Badge variant={isRegistered ? "default" : "destructive"}>
                      {isRegistered ? "Registered" : "Not Registered"}
                    </Badge>
                  </div>
                  {userStats && isRegistered && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reputation:</span>
                      <span className="font-medium">{userStats.reputationScore.toString()}</span>
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