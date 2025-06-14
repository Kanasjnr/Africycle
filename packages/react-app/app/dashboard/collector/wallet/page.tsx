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

  // Memoize the withdraw handler
  const handleWithdraw = useCallback(async () => {
    if (!address || !africycle) {
      toast.error("Please connect your wallet")
      return
    }
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    
    if (!phoneNumber) {
      toast.error("Please enter a phone number")
      return
    }
    
    try {
      setIsWithdrawing(true)
      
      // Convert amount to wei (bigint)
      const amountInWei = BigInt(Math.floor(parseFloat(withdrawAmount) * 1e18))
      
      // Check if user has enough balance
      if (balance && amountInWei > balance.value) {
        toast.error("Insufficient balance")
        setIsWithdrawing(false)
        return
      }
      
      // Call the withdraw function with phone number
      const txHash = await africycle.withdrawCollectorEarnings(address, amountInWei)
      
      toast.success(`Withdrawal successful! Transaction hash: ${txHash}`)
      
      // Reset form
      setWithdrawAmount("")
      setPhoneNumber("")
    } catch (error) {
      console.error("Error withdrawing funds:", error)
      toast.error("Withdrawal failed. Please try again.")
    } finally {
      setIsWithdrawing(false)
    }
  }, [address, africycle, withdrawAmount, phoneNumber, balance])

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
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-3">
                    <IconWallet className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CELO Balance</p>
                    <h3 className="text-2xl font-bold">
                      {balanceLoading ? (
                        "Loading..."
                      ) : (
                        `${balance?.formatted || "0.00"} ${balance?.symbol || "CELO"}`
                      )}
                    </h3>
                  </div>
                </div>
              </Card>

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

              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-yellow-100 p-3">
                    <IconClock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">cUSD Balance</p>
                    <h3 className="text-2xl font-bold">{parseFloat(formatEther(cusdBalance)).toFixed(4)} cUSD</h3>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <IconSend className="mr-3 h-4 w-4" />
                    Send Funds
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <IconDownload className="mr-3 h-4 w-4" />
                    Withdraw Earnings
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <IconRefresh className="mr-3 h-4 w-4" />
                    Refresh Balance
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Wallet Info</h3>
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
                  {userStats && (
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