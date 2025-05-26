"use client";

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { celo } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Debug environment variable
console.log('WalletConnect Project ID:', process.env.NEXT_PUBLIC_WC_PROJECT_ID);

// Create a client
const queryClient = new QueryClient();

// Configure wallet connectors
const { connectors } = getDefaultWallets({
  appName: 'AfriCycle',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || '',
});

// Create wagmi config
const config = createConfig({
  chains: [celo],
  transports: {
    [celo.id]: http(process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://forno.celo.org"),
  },
  connectors,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}