'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { celoAlfajores } from 'wagmi/chains';
import type { Config } from 'wagmi';

const projectId = process.env.WC_PROJECT_ID ?? '044601f65212332475a09bc14ceb3c34';

const config = getDefaultConfig({
  appName: 'AfriCycle',
  projectId,
  chains: [celoAlfajores],
  transports: {
    [celoAlfajores.id]: http(),
  },
  ssr: true,
}) as Config;

const queryClient = new QueryClient();

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: '#2E7D32', // Green color
            accentColorForeground: 'white',
            borderRadius: 'small',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}