"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { formatEther } from "viem"
import { toast } from "sonner"
import { ClaimSDK } from "@goodsdks/citizen-sdk"
import { useIdentitySDK } from "@goodsdks/identity-sdk"

interface UseGoodDollarProps {
  address: `0x${string}` | undefined
  publicClient: any
  walletClient: any
  chainId: number
}

export type G_DollarState = {
  entitlement: bigint
  nextClaimTime: Date | null
  isWhitelisted: boolean
  isInitializing: boolean
  isCheckingWhitelist: boolean
  totalClaimed: number
  claimCount: number
  verificationLink: string | null
  isClaiming: boolean
  isGeneratingLink: boolean
}

const G_DOLLAR_TOKEN_ADDRESS = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A" as `0x${string}`
const UBI_SCHEME_PROXY_ADDRESS = "0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1" as `0x${string}`

const withTimeout = <T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

export function useGoodDollar({ address, publicClient, walletClient, chainId }: UseGoodDollarProps) {
  const [state, setState] = useState<G_DollarState>({
    entitlement: BigInt(0),
    nextClaimTime: null,
    isWhitelisted: false,
    isInitializing: false,
    isCheckingWhitelist: false,
    totalClaimed: 0,
    claimCount: 0,
    verificationLink: null,
    isClaiming: false,
    isGeneratingLink: false,
  })

  const [claimSDK, setClaimSDK] = useState<ClaimSDK | null>(null)
  const isSDKInitialized = useRef(false)
  const identitySDK = useIdentitySDK("production")

  const updateState = useCallback((updates: Partial<G_DollarState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  // Initialize SDK and fetch UBI data
  useEffect(() => {
    const initialize = async () => {
      if (!address || !publicClient || !walletClient || !identitySDK) return

      updateState({ isInitializing: true, isCheckingWhitelist: true })

      try {
        console.log('🔵 G$ SDK: Starting initialization for', address)
        
        const { isWhitelisted, root } = await withTimeout(
          identitySDK.getWhitelistedRoot(address),
          15000,
          'G$ SDK: Whitelist check timeout'
        )

        console.log('📊 G$ SDK: Whitelist status:', isWhitelisted)
        updateState({ isWhitelisted, isCheckingWhitelist: false })

        if (isWhitelisted) {
          const sdk = new ClaimSDK({
            account: address,
            publicClient,
            walletClient,
            identitySDK: identitySDK as any,
            env: "production",
          })
          setClaimSDK(sdk)

          console.log('🔵 G$ SDK: Fetching entitlement and next claim')
          const [entitlement, nextClaim] = await Promise.all([
            withTimeout(sdk.checkEntitlement(), 15000, 'G$ SDK: Entitlement timeout'),
            withTimeout(sdk.nextClaimTime(), 15000, 'G$ SDK: Next claim timeout'),
          ])
          console.log('✅ G$ SDK: Fetch success', { entitlement: entitlement.toString(), nextClaim })

          updateState({ 
            entitlement, 
            nextClaimTime: nextClaim ? new Date(nextClaim) : null 
          })
        } else {
          console.log('ℹ️ G$ SDK: User not whitelisted, skipping ClaimSDK init')
        }
      } catch (error) {
        console.error("❌ G$ SDK: Initialization failed", error)
        updateState({ isCheckingWhitelist: false })
      } finally {
        updateState({ isInitializing: false, isCheckingWhitelist: false })
      }
    }

    if (address && !isSDKInitialized.current && identitySDK) {
      initialize()
      isSDKInitialized.current = true
    }
  }, [address, identitySDK, publicClient, walletClient, updateState])

  // Handle Verification
  const handleVerify = useCallback(async () => {
    if (!identitySDK) {
      toast.error("G$ SDK not ready")
      return
    }

    try {
      updateState({ isGeneratingLink: true })
      const fvLink = await identitySDK.generateFVLink(
        false,
        window.location.href,
        chainId
      )
      updateState({ verificationLink: fvLink, isGeneratingLink: false })
      toast.success("Verification link generated!")
      return fvLink
    } catch (error) {
      console.error("❌ G$ Verify: Failed", error)
      toast.error("Failed to generate link")
    } finally {
      updateState({ isGeneratingLink: false })
    }
  }, [identitySDK, chainId, updateState])

  const handleClaim = useCallback(async () => {
    if (!claimSDK) return { success: false, amount: 0 }

    try {
      updateState({ isClaiming: true })
      // Capture the current entitlement before claiming so we know how much was claimed
      const amountClaimed = parseFloat(formatEther(state.entitlement))
      
      const result = await claimSDK.claim()
      toast.success("G$ UBI claimed!")
      
      // Refresh data
      const [entitlement, nextClaim] = await Promise.all([
        claimSDK.checkEntitlement(),
        claimSDK.nextClaimTime(),
      ])
      
      updateState({ 
        entitlement, 
        nextClaimTime: nextClaim ? new Date(nextClaim) : null,
        isClaiming: false
      })
      
      return { success: true, result, amount: amountClaimed }
    } catch (error) {
      console.error("❌ G$ Claim: Failed", error)
      toast.error("Claim failed")
      return { success: false, amount: 0, error }
    } finally {
      updateState({ isClaiming: false })
    }
  }, [claimSDK, state.entitlement, updateState])

  return {
    ...state,
    handleVerify,
    handleClaim,
    identitySDK,
    claimSDK
  }
}
