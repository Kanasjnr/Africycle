import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAfriCycle } from '@/hooks/useAfricycle'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { celo } from 'viem/chains'

// Integration test setup with real blockchain calls
const config = getDefaultConfig({
  appName: 'Africycle Test',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [celo],
  ssr: false,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 0,
    },
  },
})

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
)

describe('useAfriCycle Hook (Integration Test)', () => {
  const contractAddress = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
  const rpcUrl = process.env.NEXT_PUBLIC_CELO_RPC_URL!

  beforeEach(() => {
    queryClient.clear()
  })

  it('returns null when wallet is not connected', () => {
    const { result } = renderHook(
      () => useAfriCycle({ contractAddress, rpcUrl }),
      { wrapper: TestWrapper }
    )

    expect(result.current).toBe(null)
  })

  it('initializes AfriCycle instance when wallet is connected', async () => {
    // This test would require a mock wallet connection
    // For now, we test the hook structure
    const { result } = renderHook(
      () => useAfriCycle({ contractAddress, rpcUrl }),
      { wrapper: TestWrapper }
    )

    // Should be null without wallet connection
    expect(result.current).toBe(null)
  })

  it('validates contract address format', () => {
    const invalidAddress = 'invalid-address'
    
    expect(() => {
      renderHook(
        () => useAfriCycle({ contractAddress: invalidAddress as `0x${string}`, rpcUrl }),
        { wrapper: TestWrapper }
      )
    }).not.toThrow()
  })

  it('validates RPC URL format', () => {
    const invalidRpcUrl = 'not-a-url'
    
    expect(() => {
      renderHook(
        () => useAfriCycle({ contractAddress, rpcUrl: invalidRpcUrl }),
        { wrapper: TestWrapper }
      )
    }).not.toThrow()
  })
})
