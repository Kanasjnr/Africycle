import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useGoodDollar } from '../providers/GoodDollarProvider';
import { formatEther } from 'viem';

interface ClaimState {
  canClaim: boolean;
  claimAmount: string;
  nextClaimTime: Date | null;
  isLoading: boolean;
  error: string | null;
}

export const useGoodDollarClaim = () => {
  const { address } = useAccount();
  const { sdk, isInitialized, error: sdkError } = useGoodDollar();
  const [claimState, setClaimState] = useState<ClaimState>({
    canClaim: false,
    claimAmount: '0',
    nextClaimTime: null,
    isLoading: false,
    error: null,
  });

  // Check claim eligibility
  const checkEligibility = useCallback(async () => {
    if (!sdk || !address || !isInitialized) return;

    try {
      setClaimState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const amount = await sdk.checkEntitlement();
      const nextTime = await sdk.getNextClaimTime();
      
      setClaimState(prev => ({
        ...prev,
        canClaim: amount > 0,
        claimAmount: formatEther(amount),
        nextClaimTime: nextTime,
        isLoading: false,
      }));
    } catch (error) {
      setClaimState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check eligibility',
      }));
    }
  }, [sdk, address, isInitialized]);

  // Perform claim
  const claim = useCallback(async () => {
    if (!sdk || !address || !isInitialized) {
      throw new Error('SDK not initialized or no address connected');
    }

    try {
      setClaimState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const tx = await sdk.claim();
      await tx.wait();
      
      // Refresh eligibility after successful claim
      await checkEligibility();
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Claim failed';
      setClaimState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [sdk, address, isInitialized, checkEligibility]);

  // Check eligibility periodically
  useEffect(() => {
    if (sdk && address && isInitialized) {
      checkEligibility();
      const interval = setInterval(checkEligibility, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [sdk, address, isInitialized, checkEligibility]);

  // Update error state if SDK initialization fails
  useEffect(() => {
    if (sdkError) {
      setClaimState(prev => ({
        ...prev,
        error: sdkError,
      }));
    }
  }, [sdkError]);

  return {
    ...claimState,
    claim,
    checkEligibility,
    isInitialized,
  };
}; 