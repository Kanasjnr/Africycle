import { getDataSuffix, submitReferral } from '@divvi/referral-sdk';
import { createWalletClient, custom, type Address, type WalletClient, type Transport, type Chain, type Account, encodeFunctionData } from 'viem';
import { celo } from 'viem/chains';

// Your Divvi Identifier and provider addresses
const DIVVI_CONFIG = {
  consumer: '0xa1599790B763E537bd15b5b912012e5Fb65491a3' as Address,
  providers: [
    '0x0423189886d7966f0dd7e7d256898daeee625dca' as Address,
    '0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8' as Address
  ] as Address[]
};

/**
 * Creates a wallet client for Divvi integration
 */
export const createDivviWalletClient = async (): Promise<WalletClient<Transport, Chain, Account>> => {
  if (!window.ethereum) throw new Error('Ethereum provider not found');
  
  // Create the wallet client first
  const client = createWalletClient({
    chain: celo,
    transport: custom(window.ethereum)
  });

  // Get the account
  const [address] = await client.getAddresses();
  if (!address) throw new Error('No accounts found');

  // Create account object
  const account: Account = {
    address,
    type: 'json-rpc'
  };

  // Return a new client with the account
  return createWalletClient({
    chain: celo,
    transport: custom(window.ethereum),
    account
  });
};

/**
 * Checks if a referral has already been submitted for a user
 * @param userAddress The user's address
 * @returns True if a referral has been submitted, false otherwise
 */
export const hasReferralBeenSubmitted = (userAddress: Address): boolean => {
  try {
    // Use local storage for simplicity; replace with a backend API for production
    const referralKey = `divvi_referral_${userAddress.toLowerCase()}`;
    const submitted = localStorage.getItem(referralKey);
    return submitted === 'true';
  } catch (error) {
    console.error('Error checking referral status:', error);
    return false;
  }
};

/**
 * Marks a referral as submitted for a user
 * @param userAddress The user's address
 */
export const markReferralSubmitted = (userAddress: Address): void => {
  try {
    const referralKey = `divvi_referral_${userAddress.toLowerCase()}`;
    localStorage.setItem(referralKey, 'true');
  } catch (error) {
    console.error('Error marking referral as submitted:', error);
  }
};

/**
 * Appends Divvi referral data to transaction data
 * @param originalData The original transaction data
 * @returns The transaction data with Divvi referral suffix
 */
export const appendDivviReferralData = (originalData: `0x${string}`): `0x${string}` => {
  // Validate input
  if (!originalData || typeof originalData !== 'string' || !originalData.startsWith('0x')) {
    console.error('Invalid transaction data:', originalData);
    throw new Error('Invalid transaction data: must be a 0x-prefixed hex string');
  }

  // Get the data suffix
  const dataSuffix = getDataSuffix({
    consumer: DIVVI_CONFIG.consumer,
    providers: DIVVI_CONFIG.providers
  });
  console.log('Divvi data suffix:', dataSuffix);

  // Ensure both strings are valid hex
  // Remove the 0x prefix for validation
  const originalDataHex = originalData.slice(2);
  const dataSuffixHex = dataSuffix.slice(2);
  
  if (!/^[0-9a-fA-F]*$/.test(originalDataHex) || !/^[0-9a-fA-F]*$/.test(dataSuffixHex)) {
    console.error('Invalid hex data:', { 
      originalData: originalDataHex, 
      dataSuffix: dataSuffixHex 
    });
    throw new Error('Invalid hex data in transaction or suffix');
  }

  // Concatenate the original data and suffix
  const concatenatedData = `0x${originalDataHex}${dataSuffixHex}` as `0x${string}`;
  console.log('Concatenated transaction data:', concatenatedData);

  return concatenatedData;
};

/**
 * Submits a transaction hash to Divvi for referral tracking
 * @param txHash The transaction hash to submit
 * @param chainId The chain ID where the transaction was executed
 */
export const submitDivviReferral = async (txHash: `0x${string}`, chainId: number): Promise<void> => {
  try {
    await submitReferral({
      txHash,
      chainId
    });
    console.log('Successfully submitted referral to Divvi for tx:', txHash);
  } catch (error) {
    console.error('Error submitting referral to Divvi:', error);
    // Log the error but don't throw to avoid blocking the transaction flow
  }
};

/**
 * Simple wrapper to add Divvi referral tracking to a transaction
 */
export const withDivviTracking = async <T extends () => Promise<{ request: any }>>(
  transactionFn: T,
  walletClient: WalletClient<Transport, Chain, Account>,
  userAddress: Address,
  isValueGenerating: boolean = false
): Promise<`0x${string}`> => {
  try {
    // Get the transaction request
    const simulation = await transactionFn();
    if (!simulation?.request) {
      console.error('Simulation result:', simulation);
      throw new Error('Transaction simulation failed: no request returned');
    }

    const request = simulation.request;
    
    // Encode the function data if not present
    if (!request.data && request.abi && request.functionName && request.args) {
      request.data = encodeFunctionData({
        abi: request.abi,
        functionName: request.functionName,
        args: request.args
      });
      console.log('Encoded function data:', request.data);
    }

    if (!request.data) {
      console.error('Request object:', request);
      throw new Error('Transaction simulation failed: could not encode function data');
    }

    // Add Divvi referral data if this is a value-generating transaction
    let finalData = request.data;
    if (isValueGenerating) {
      try {
        console.log('Original transaction data:', request.data);
        
        // Get the data suffix first
        const dataSuffix = getDataSuffix({
          consumer: DIVVI_CONFIG.consumer,
          providers: DIVVI_CONFIG.providers
        });
        console.log('Divvi data suffix:', dataSuffix);

        // Verify the suffix starts with the expected prefix (without 0x)
        if (!dataSuffix.startsWith('6decb85d')) {
          console.error('Invalid Divvi data suffix prefix:', dataSuffix);
          throw new Error('Invalid Divvi data suffix: incorrect prefix');
        }

        // Append the suffix directly
        const originalDataHex = request.data.slice(2); // Remove 0x
        finalData = `0x${originalDataHex}${dataSuffix}` as `0x${string}`;
        
        console.log('Final transaction data with Divvi suffix:', finalData);

        // Verify the suffix is still present in the final data
        if (!finalData.endsWith(dataSuffix)) {
          console.error('Divvi data suffix verification failed:', {
            expectedSuffix: dataSuffix,
            actualData: finalData.slice(-dataSuffix.length)
          });
          throw new Error('Divvi data suffix verification failed');
        }

        // Additional verification that the prefix is still correct
        const suffixInFinalData = finalData.slice(-dataSuffix.length);
        if (!suffixInFinalData.startsWith('6decb85d')) {
          console.error('Divvi prefix verification failed:', {
            expectedPrefix: '6decb85d',
            actualPrefix: suffixInFinalData.slice(0, 8)
          });
          throw new Error('Divvi prefix verification failed');
        }
      } catch (error) {
        console.error('Failed to add Divvi data:', error);
        throw error; // We should throw here to prevent invalid transactions
      }
    }

    // Execute the transaction
    console.log('Executing transaction with data:', finalData);
    const txHash = await walletClient.writeContract({
      ...request,
      data: finalData,
      account: userAddress
    });

    // Submit referral if this was a value-generating transaction
    if (isValueGenerating) {
      try {
        const chainId = await walletClient.getChainId();
        await submitReferral({ txHash, chainId });
        console.log('Submitted referral to Divvi for tx:', txHash);
      } catch (error) {
        console.error('Error submitting referral to Divvi:', error);
        // Don't throw here - the transaction was successful even if referral submission failed
      }
    }

    return txHash;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};