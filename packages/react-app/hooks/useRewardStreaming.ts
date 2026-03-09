"use client"

import { useCallback, useEffect, useState } from "react"
import { parseEther, getAddress } from "viem"

// Superfluid CFAv1Forwarder — universal, same address on all chains
const FORWARDER_ADDR = "0xcfA132E353cB4E398080B9700609bb008eceB125" as const

// GoodDollar Contract Addresses for Celo
const G_DOLLAR_CONFIG = {
  // Mainnet
  42220: {
    token: getAddress("0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9C7A"),
    scheme: getAddress("0x22867567E2D80f2049200E25C6F31CB6Ec2F0faf"),
  },
} as const


const CFA_ABI = [
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "token", type: "address" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "receiver", type: "address" },
    ],
    name: "getFlowInfo",
    outputs: [
      { internalType: "uint256", name: "lastUpdated", type: "uint256" },
      { internalType: "int96",   name: "flowrate",    type: "int96" },
      { internalType: "uint256", name: "deposit",     type: "uint256" },
      { internalType: "uint256", name: "owedDeposit", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "token", type: "address" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "int96", name: "flowrate", type: "int96" },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "setFlowrate",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "token", type: "address" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "int96", name: "flowrate", type: "int96" },
      { internalType: "bytes", name: "userData", type: "bytes" },
    ],
    name: "createFlow",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "token", type: "address" },
      { internalType: "int96",                name: "flowrate", type: "int96" },
    ],
    name: "getBufferAmountByFlowrate",
    outputs: [{ internalType: "uint256", name: "bufferAmount", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "token", type: "address" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "flowOperator", type: "address" },
    ],
    name: "getFlowOperatorPermissions",
    outputs: [{ internalType: "uint8", name: "permissions", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "token", type: "address" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "int96",   name: "flowrate", type: "int96" },
      { internalType: "bytes",   name: "userData", type: "bytes" },
    ],
    name: "createFlow",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "token", type: "address" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "int96",   name: "flowrate", type: "int96" },
      { internalType: "bytes",   name: "userData", type: "bytes" },
    ],
    name: "updateFlow",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "token", type: "address" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "int96",   name: "flowrate", type: "int96" },
      { internalType: "bytes",   name: "userData", type: "bytes" },
    ],
    name: "setFlowrate",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "contract ISuperToken", name: "token", type: "address" },
      { internalType: "address", name: "flowOperator", type: "address" },
      { internalType: "uint8", name: "permissions", type: "uint8" },
      { internalType: "int96", name: "flowrateAllowance", type: "int96" },
    ],
    name: "updateFlowOperatorPermissions",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const

export interface StreamFlowInfo {
  lastUpdated: bigint
  flowRatePerSecond: bigint
  deposit: bigint
  isActive: boolean
  totalAccruedSinceStart: bigint
}

interface UseRewardStreamingProps {
  address: `0x${string}` | undefined
  publicClient: any 
  walletClient?: any
  chainId: number
  receiver?: `0x${string}`
}


export function useRewardStreaming({ address, publicClient, walletClient, chainId, receiver }: UseRewardStreamingProps) {
  const [flowInfo, setFlowInfo] = useState<StreamFlowInfo>({
    lastUpdated: BigInt(0),
    flowRatePerSecond: BigInt(0),
    deposit: BigInt(0),
    isActive: false,
    totalAccruedSinceStart: BigInt(0),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFlowInfo = useCallback(async () => {
    if (!address || !publicClient) return

    const config = (G_DOLLAR_CONFIG as any)[chainId] || G_DOLLAR_CONFIG[42220]
    
    setIsLoading(true)
    setError(null)

    // Default logic: Source (Scheme) -> Destination (User)
    const sender = config.scheme
    const actualReceiver = receiver || address

    try {
      console.log(`🔍 [Streaming] Network: ${chainId === 44787 ? 'Alfajores' : 'Mainnet'} (${chainId})`);
      console.log(`🔍 [Streaming] Checking flow: ${sender} -> ${actualReceiver}`);
      console.log(`🔍 [Streaming] Token: ${config.token}`);
      
      const result = await publicClient.readContract({
        address: FORWARDER_ADDR,
        abi: CFA_ABI,
        functionName: "getFlowInfo",
        args: [config.token, sender, actualReceiver],
      }) as readonly [bigint, bigint, bigint, bigint]

      console.log(`📊 [Streaming] Raw Flow Info:`, result);

      const [lastUpdated, flowrate, deposit] = result;
      // In CFAv1Forwarder, even if you are the sender, flowrate is positive for the specific flow
      const flowRatePerSecond = flowrate < BigInt(0) ? BigInt(0) : flowrate
      const isActive = flowRatePerSecond > BigInt(0)

      const nowSec = BigInt(Math.floor(Date.now() / 1000))
      const elapsed = lastUpdated > BigInt(0) ? nowSec - lastUpdated : BigInt(0)
      const totalAccruedSinceStart = isActive ? flowRatePerSecond * elapsed : BigInt(0)

      console.log(`📈 [Streaming] Flow Rate: ${flowRatePerSecond.toString()} wei/sec`);
      console.log(`📈 [Streaming] Active: ${isActive}`);
      console.log(`📈 [Streaming] Total Accrued: ${totalAccruedSinceStart.toString()}`);

      setFlowInfo({ lastUpdated, flowRatePerSecond, deposit, isActive, totalAccruedSinceStart })
    } catch (err) {
      console.error("❌ [Streaming] Failed to query CFAv1Forwarder:", err)
      setError("Failed to fetch streaming data")
    } finally {
      setIsLoading(false)
    }
  }, [address, publicClient, chainId, receiver])

  useEffect(() => {
    fetchFlowInfo()
  }, [fetchFlowInfo])

  const perMonthToFlowRate = useCallback((gDollarPerMonth: number): bigint => {
    const weiPerMonth = parseEther(gDollarPerMonth.toFixed(18))
    return weiPerMonth / BigInt(2_592_000) // 30 days × 24h × 3600s
  }, [])

  const syncStream = useCallback(async (receiver: `0x${string}`, flowRate: bigint) => {
    if (!address || !walletClient || !publicClient) {
      throw new Error("Wallet not connected")
    }

    const config = (G_DOLLAR_CONFIG as any)[chainId] || G_DOLLAR_CONFIG[42220]

    try {
      // Step 0: Check Balance
      // Superfluid needs a buffer (deposit) to start a stream.
      // Usually 4 hours of flow. For 100 G$/mo, it's ~0.6 G$.
      const balance = await publicClient.readContract({
        address: config.token,
        abi: [{ inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],
        functionName: "balanceOf",
        args: [address]
      }) as bigint

      if (balance === BigInt(0)) {
        throw new Error("You need some G$ in your wallet to start a stream (for the security deposit).")
      }

      // Step 1: Check Permissions
      // We are trying to start a flow FROM the Scheme TO the User.
      // The User (address) must have permission to manage the Scheme's flows.
      console.log(`🔍 [Streaming] Checking if User can manage Scheme flows...`)
      const permissions = await publicClient.readContract({
        address: FORWARDER_ADDR,
        abi: CFA_ABI,
        functionName: "getFlowOperatorPermissions",
        args: [config.token, config.scheme, address]
      }) as number

      console.log(`📊 [Streaming] Operator permissions: ${permissions}`)
      
      // In this model, the Scheme is expected to have pre-authorized the user. 
      // If permissions is 0, it means the user hasn't been whitelisted or authorized by the G$ protocol yet.
      if (permissions === 0) {
        throw new Error("You don't have permission to start the reward stream yet. Please make sure you are whitelisted and verified.")
      }

      console.log(`🔍 [Streaming] Verifying current flow...`)
      const sender = config.scheme
      const currentFlow = await publicClient.readContract({
        address: FORWARDER_ADDR,
        abi: CFA_ABI,
        functionName: "getFlowInfo",
        args: [config.token, sender, receiver],
      }) as readonly [bigint, bigint, bigint, bigint]
      
      const currentRate = currentFlow[1]
      const isNewFlow = currentRate === BigInt(0)
      const functionName = isNewFlow ? "createFlow" : "updateFlow"

      console.log(`🚀 [Streaming] ${isNewFlow ? 'Creating' : 'Updating'} Stream:`, {
        method: functionName,
        token: config.token,
        sender,
        receiver,
        flowRate: flowRate.toString(),
        currentRate: currentRate.toString()
      })

      // Use the specific method recommended by documentation
      // We use createFlow/updateFlow directly on the forwarder
      const hash = await walletClient.writeContract({
        address: FORWARDER_ADDR,
        abi: CFA_ABI,
        functionName,
        args: [config.token, sender, receiver, flowRate, "0x"],
        account: address
      })

      console.log(`✅ [Streaming] Sync Transaction Sent:`, hash)
      
      // Trigger a refresh after a short delay
      setTimeout(() => fetchFlowInfo(), 2000)
      
      return { success: true, hash }
    } catch (err) {
      console.error("❌ [Streaming] Sync failed:", err)
      throw err
    }
  }, [address, walletClient, publicClient, chainId, fetchFlowInfo])

  return {
    ...flowInfo,
    isLoading,
    error,
    refetch: fetchFlowInfo,
    perMonthToFlowRate,
    syncStream,
  }
}
