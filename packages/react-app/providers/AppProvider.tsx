"use client";

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { celo, celoAlfajores } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import { useConnect, useAccount } from 'wagmi';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Debug environment variable
console.log('WalletConnect Project ID:', process.env.NEXT_PUBLIC_WC_PROJECT_ID);

// Create a client
const queryClient = new QueryClient();

// MiniPay Context
interface MiniPayContextType {
  isMiniPay: boolean;
  isAutoConnecting: boolean;
}

const MiniPayContext = createContext<MiniPayContextType>({
  isMiniPay: false,
  isAutoConnecting: false,
});

export const useMiniPay = () => useContext(MiniPayContext);

// Configure wallet connectors
const { connectors } = getDefaultWallets({
  appName: 'AfriCycle',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || '',
});

// Create wagmi config with injected connector first for MiniPay
const config = createConfig({
  chains: [celo, celoAlfajores],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://forno.celo.org"),
    [celoAlfajores.id]: http(),
  },
  connectors: [
    injected(), // MiniPay uses injected connector
    ...connectors,
  ],
});

// MiniPay Auto-Connection Component
function MiniPayAutoConnect({ children }: { children: ReactNode }) {
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    // Check if we're in MiniPay environment
    const checkMiniPay = () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        const isMiniPayWallet = !!(window.ethereum as any).isMiniPay;
        setIsMiniPay(isMiniPayWallet);
        
        // Auto-connect if in MiniPay and not already connected
        if (isMiniPayWallet && !isConnected && connectors.length > 0) {
          setIsAutoConnecting(true);
          connect({ connector: connectors[0] }); // Use first connector (injected)
        }
      }
    };

    checkMiniPay();
  }, [connect, connectors, isConnected]);

  useEffect(() => {
    // Stop auto-connecting once connected
    if (isConnected && isAutoConnecting) {
      setIsAutoConnecting(false);
    }
  }, [isConnected, isAutoConnecting]);

  return (
    <MiniPayContext.Provider value={{ isMiniPay, isAutoConnecting }}>
      {children}
    </MiniPayContext.Provider>
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <MiniPayAutoConnect>
            {children}
          </MiniPayAutoConnect>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}