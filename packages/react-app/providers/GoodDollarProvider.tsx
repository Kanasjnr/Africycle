'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ClaimSDK } from '@gooddollar/web3sdk-v2';

interface GoodDollarContextType {
  sdk: ClaimSDK | null;
  isInitialized: boolean;
  error: string | null;
}

const GoodDollarContext = createContext<GoodDollarContextType>({
  sdk: null,
  isInitialized: false,
  error: null,
});

export const useGoodDollar = () => useContext(GoodDollarContext);

export function GoodDollarProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [sdk, setSdk] = useState<ClaimSDK | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSDK = async () => {
      if (!publicClient || !walletClient || !address) {
        setSdk(null);
        setIsInitialized(false);
        return;
      }

      try {
        // Create a provider that matches the SDK's expected interface
        const provider = {
          getNetwork: async () => ({ chainId: publicClient.chain.id }),
          getSigner: () => ({
            getAddress: async () => address,
            signMessage: async (message: string) => {
              if (!walletClient) throw new Error('Wallet client not available');
              const signature = await walletClient.signMessage({ message });
              return signature;
            },
          }),
          // Add other required provider methods as needed
        };

        const newSdk = new ClaimSDK(provider as any, 'production-celo');
        setSdk(newSdk);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize GoodDollar SDK');
        setIsInitialized(false);
      }
    };

    initializeSDK();
  }, [publicClient, walletClient, address]);

  return (
    <GoodDollarContext.Provider value={{ sdk, isInitialized, error }}>
      {children}
    </GoodDollarContext.Provider>
  );
} 