
import { getDataSuffix, submitReferral } from '@divvi/referral-sdk';
import { createWalletClient, custom, type Address, type WalletClient, type Transport, type Chain, type Account } from 'viem';
import { celo } from 'viem/chains';

// Your Divvi Identifier and provider addresses
const DIVVI_CONFIG = {
  consumer: '0xa1599790B763E537bd15b5b912012e5Fb65491a3' as Address, // Your Divvi Identifier
  providers: [
    '0x0423189886d7966f0dd7e7d256898daeee625dca' as Address,
    '0x5f0a55fad9424ac99429f635dfb9bf20c3360ab8' as Address
  ] as Address[]
};

/**
 * Creates a wallet client for Divvi integration
 * @returns A viem WalletClient configured for the Celo chain
 */
export const createDivviWalletClient = (): WalletClient<Transport, Chain, Account> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('Ethereum provider not found');
  }

  console.log('Ethereum provider:', window.ethereum);

  const client = createWalletClient({
    chain: celo,
    transport: custom(window.ethereum)
  });

  console.log('Created wallet client:', client);

  return client;
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
  if (!/^0x[0-9a-fA-F]*$/.test(originalData) || !/^0x[0-9a-fA-F]*$/.test(dataSuffix)) {
    console.error('Invalid hex data:', { originalData, dataSuffix });
    throw new Error('Invalid hex data in transaction or suffix');
  }

  // Concatenate the original data and suffix, removing the '0x' from the suffix
  const concatenatedData = `${originalData}${dataSuffix.slice(2)}` as `0x${string}`;
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
 * Wraps a transaction with Divvi referral tracking
 * @param transactionFn The original transaction function to wrap (simulateContract)
 * @param walletClient The wallet client to use for transaction execution
 * @param userAddress The user's address
 * @param isValueGenerating Whether the transaction is value-generating
 * @returns The transaction hash
 */
export const withDivviTracking = async <T extends () => Promise<{ request: any }>>(
  transactionFn: T,
  walletClient: WalletClient<Transport, Chain, Account>,
  userAddress: Address,
  isValueGenerating: boolean = false
): Promise<`0x${string}`> => {
  if (!userAddress) {
    throw new Error('No user address provided. Please connect your wallet first.');
  }

  if (!walletClient) {
    throw new Error('Wallet client not initialized.');
  }

  try {
    // Verify chain ID
    const chainId = await walletClient.getChainId();
    if (chainId !== celo.id) { // celo.id is 42220 for Celo mainnet
      throw new Error(`Incorrect network. Please switch to Celo mainnet (chain ID ${celo.id}).`);
    }

    // Get the transaction request by calling the simulation function
    const { request } = await transactionFn();

    if (!request || !request.data) {
      throw new Error('Transaction simulation failed: no request or data field returned.');
    }

    console.log('Original transaction data:', request.data);

    let dataWithReferral = request.data as `0x${string}`;
    let shouldSubmitReferral = false;

    // Apply Divvi referral logic only for the first value-generating transaction
    if (isValueGenerating && !hasReferralBeenSubmitted(userAddress)) {
      dataWithReferral = appendDivviReferralData(request.data);
      console.log('Transaction data with Divvi referral:', dataWithReferral);
      shouldSubmitReferral = true;
    }

    // Execute the transaction with the (potentially modified) data
    const txHash = await walletClient.writeContract({
      chain: celo,
      address: request.address,
      abi: request.abi,
      functionName: request.functionName,
      args: request.args,
      data: dataWithReferral,
      account: userAddress
    });

    console.log('Transaction hash:', txHash);

    // Submit the referral to Divvi if applicable
    if (shouldSubmitReferral) {
      await submitDivviReferral(txHash, chainId);
      markReferralSubmitted(userAddress);
    }

    return txHash;
  } catch (error) {
    console.error('Error in withDivviTracking:', error);
    if (error instanceof Error) {
      if (error.message.includes('user rejected')) {
        throw new Error('Transaction was rejected by user.');
      }
      if (error.message.includes('invalid hex data')) {
        throw new Error('Invalid transaction data format.');
      }
    }
    throw new Error('Transaction failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};