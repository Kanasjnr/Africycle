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
} from "@tabler/icons-react"
import { useAfriCycle } from "@/hooks/useAfricycle"
import { useAccount, usePublicClient } from "wagmi"
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

export default function WalletPage() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState<bigint>(BigInt(0))
  const [cusdBalance, setCusdBalance] = useState<bigint>(BigInt(0))
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [transactions, setTransactions] = useState<TransactionProps[]>([])
  const [lastFetchedBlock, setLastFetchedBlock] = useState<bigint | null>(null)
  
  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })

  // Memoize the formatted balances
  const formattedBalances = useMemo(() => ({
    cusd: formatEther(cusdBalance),
    earnings: formatEther(balance)
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
      if (amountInWei > balance) {
        toast.error("Insufficient balance")
        setIsWithdrawing(false)
        return
      }
      
      // Call the withdraw function with phone number
      const txHash = await africycle.withdrawCollectorEarnings(address, amountInWei)
      
      toast.success(`Withdrawal successful! Transaction hash: ${txHash}`)
      
      // Refresh balance
      const stats = await africycle.getCollectorStats(address)
      setBalance(stats.totalEarnings)
      
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

  // Separate effect for fetching balances
  useEffect(() => {
    async function fetchBalances() {
      if (!address || !africycle || !publicClient) return
      
      try {
        // Fetch collector stats to get earnings
        const stats = await africycle.getCollectorStats(address)
        setBalance(stats.totalEarnings)
        
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
  }, [address, africycle, publicClient])

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
        
        setLoading(true)
        
        // Fetch recent transactions
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
          fromBlock: lastFetchedBlock || blockNumber - BigInt(1000), // Only fetch new blocks
          toBlock: blockNumber
        })
        
        if (logs.length > 0) {
          // Get blocks for all transactions
          const blocks = await Promise.all(
            logs.map(log => publicClient.getBlock({ blockHash: log.blockHash }))
          )
          
          // Filter transactions for this address and remove duplicates
          const newTransactions = logs
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
            const uniqueNewTransactions = newTransactions.filter(tx => !existingHashes.has(tx.hash))
            return [...uniqueNewTransactions, ...prev]
          })
          
          setLastFetchedBlock(blockNumber)
        }
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTransactions()
    
    // Set up polling for new transactions every 15 seconds
    const interval = setInterval(fetchTransactions, 15000)
    return () => clearInterval(interval)
  }, [address, publicClient, lastFetchedBlock])

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

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Digital Wallet"
        text="Manage your earnings, view transaction history, and withdraw funds"
      />
      <div className="grid gap-6">
        {/* Wallet Balance */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Wallet Balance</h2>
            <p className="text-sm text-muted-foreground">
              Your current balance and recent activity
            </p>
            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-10 w-40" />
              ) : (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{formattedBalances.cusd} cUSD</span>
                    <Badge variant="secondary">Wallet Balance</Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{formattedBalances.earnings} cUSD</span>
                    <Badge variant="secondary">Available for withdrawal</Badge>
                  </div>
                </div>
              )}
              <div className="mt-6 flex gap-2">
                <Button className="flex-1" disabled>
                  <IconArrowDown className="mr-2 h-4 w-4" />
                  Deposit
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => document.getElementById('withdraw-section')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <IconArrowUp className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
                
                <Button variant="outline" className="flex-1" disabled>
                  <IconSend className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
              <div className="mt-6">
                <label className="text-sm font-medium">Wallet Address</label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    readOnly
                    value={address || "Connect your wallet"}
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => address && copyToClipboard(address)}
                    disabled={!address}
                  >
                    <IconCopy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-6" id="withdraw-section">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">Common wallet operations</p>
            <div className="mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Withdraw to Mobile Money</label>
                  <div className="mt-1.5 space-y-2">
                    <Input 
                      placeholder="Enter amount (cUSD)" 
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <Input 
                      placeholder="Enter phone number" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                    <Button 
                      className="w-full"
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || loading || !address || balance === BigInt(0)}
                    >
                      {isWithdrawing ? "Processing..." : "Withdraw"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Note: This will initiate a blockchain transaction to withdraw your earnings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <p className="text-sm text-muted-foreground">
              Your recent wallet transactions
            </p>
            <div className="mt-4">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  All Transactions
                </Button>
                <Button variant="outline" className="flex-1">
                  Deposits
                </Button>
                <Button variant="outline" className="flex-1">
                  Withdrawals
                </Button>
              </div>
              <div className="mt-4 divide-y">
                {transactionList}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}