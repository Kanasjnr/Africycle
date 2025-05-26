import { getDataSuffix, submitReferral } from '@divvi/referral-sdk'
import { createWalletClient, custom, type Address } from 'viem'
import { celo } from 'viem/chains'

// Your Divvi Identifier and provider addresses
const DIVVI_CONFIG = {
  consumer: '0xa1599790B763E537bd15b5b912012e5Fb65491a3' as Address, // Your Divvi Identifier
  providers: [
    '0x0423189886d7966f0dd7e7d256898daeee625dca' as Address,
    '0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8' as Address
  ] as Address[]
}

/**
 * Creates a wallet client for Divvi integration
 */
export const createDivviWalletClient = () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found')
  }

  return createWalletClient({
    chain: celo,
    transport: custom(window.ethereum)
  })
}

/**
 * Appends Divvi referral data to transaction data
 * @param originalData The original transaction data
 * @returns The transaction data with Divvi referral suffix
 */
export const appendDivviReferralData = (originalData: `0x${string}`): `0x${string}` => {
  // Validate input
  if (!originalData || typeof originalData !== 'string' || !originalData.startsWith('0x')) {
    console.error('Invalid transaction data:', originalData)
    throw new Error('Invalid transaction data: must be a 0x-prefixed hex string')
  }

  // Log the data suffix
  const dataSuffix = getDataSuffix({
    consumer: DIVVI_CONFIG.consumer,
    providers: DIVVI_CONFIG.providers
  })
  console.log('Divvi data suffix:', dataSuffix)
  
  // Ensure both strings are valid hex
  if (!/^0x[0-9a-fA-F]*$/.test(originalData) || !/^0x[0-9a-fA-F]*$/.test(dataSuffix)) {
    console.error('Invalid hex data:', { originalData, dataSuffix })
    throw new Error('Invalid hex data in transaction or suffix')
  }
  
  return (originalData + dataSuffix) as `0x${string}`
}

/**
 * Submits a transaction hash to Divvi for referral tracking
 * @param txHash The transaction hash to submit
 * @param chainId The chain ID where the transaction was executed
 */
export const submitDivviReferral = async (txHash: `0x${string}`, chainId: number) => {
  try {
    await submitReferral({
      txHash,
      chainId
    })
    console.log('Successfully submitted referral to Divvi')
  } catch (error) {
    console.error('Error submitting referral to Divvi:', error)
    // We don't throw here to prevent blocking the main transaction flow
  }
}

/**
 * Wraps a transaction with Divvi referral tracking
 * @param transactionFn The original transaction function to wrap
 * @returns A new function that includes Divvi referral tracking
 */
export const withDivviTracking = async <T extends () => Promise<{ request: any }>>(
  transactionFn: T
): Promise<`0x${string}`> => {
  const walletClient = createDivviWalletClient()
  const [account] = await walletClient.getAddresses()
  
  try {
    // Get the transaction request by calling the simulation function
    const { request } = await transactionFn()
    
    // Log the full request for debugging
    console.log('Simulation request:', JSON.stringify(request, null, 2))
    
    if (!request) {
      throw new Error('Transaction simulation failed: no request returned')
    }

    // Create a proper transaction request
    const txRequest = {
      ...request,
      to: request.address,
      account: { address: account, type: 'json-rpc' } as const
    }

    // Execute the transaction
    const txHash = await walletClient.writeContract(txRequest)
    
    // Get the chain ID
    const chainId = await walletClient.getChainId()
    
    // Submit the referral
    await submitDivviReferral(txHash, chainId)
    
    return txHash
  } catch (error) {
    console.error('Error in withDivviTracking:', error)
    throw error
  }
} 