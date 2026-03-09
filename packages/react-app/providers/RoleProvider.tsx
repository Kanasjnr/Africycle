"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAfriCycle } from '@/hooks/useAfricycle';

export type Role = 'collector' | 'recycler' | null;

// Role mapping from bytes32 to human-readable roles
// These values should match the keccak256 hashes of the role names in the contract
const ROLE_MAPPING: { [key: string]: Role } = {
  // keccak256("COLLECTOR_ROLE")
  '0x14cf45180c3fcf249a5a305e9657ea05c14fd4f4e1800ee0216a8213091711d2': 'collector',
  // keccak256("RECYCLER_ROLE")
  '0x11d2c681bc9c10ed61f9a422c0dbaaddc4054ce58ec726aca73e7e4d31bcd154': 'recycler',
};

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  isLoading: boolean;
  isRegistered: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Cache key for localStorage
const ROLE_CACHE_KEY = 'africycle_user_role';

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const { address, isConnected } = useAccount();

  // Initialize AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL as string,
  });

  // Helper function to get cached role
  const getCachedRole = (userAddress: string): Role => {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(`${ROLE_CACHE_KEY}_${userAddress.toLowerCase()}`);
      if (cached) {
        const { role: cachedRole, timestamp } = JSON.parse(cached);
        // Cache is valid for 5 minutes
        const isValid = Date.now() - timestamp < 5 * 60 * 1000;
        if (isValid && (cachedRole === 'collector' || cachedRole === 'recycler')) {
          return cachedRole;
        }
      }
    } catch (error) {
      console.error('Error reading cached role:', error);
    }
    return null;
  };

  // Helper function to cache role
  const setCachedRole = (userAddress: string, userRole: Role) => {
    if (typeof window === 'undefined') return;

    try {
      const cacheData = {
        role: userRole,
        timestamp: Date.now()
      };
      localStorage.setItem(`${ROLE_CACHE_KEY}_${userAddress.toLowerCase()}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching role:', error);
    }
  };

  useEffect(() => {
    const loadRole = async () => {
      try {
        if (!isConnected || !address) {
          setRole(null);
          setIsRegistered(false);
          setIsLoading(false);
          return;
        }

        const cachedRole = getCachedRole(address);
        if (cachedRole) {
          setRole(cachedRole);
          setIsRegistered(true);
          setIsLoading(false);
        }

        if (africycle) {
          const blockchainRole = await africycle.getUserRole(address);
          const isZeroRole = blockchainRole === "0x0000000000000000000000000000000000000000000000000000000000000000";

          if (!isZeroRole) {
            const humanReadableRole = ROLE_MAPPING[blockchainRole.toLowerCase()];

            if (humanReadableRole) {
              if (humanReadableRole !== cachedRole) {
                setRole(humanReadableRole);
                setIsRegistered(true);
                setCachedRole(address, humanReadableRole);
              }
            } else {
              setRole(null);
              setIsRegistered(false);
              setCachedRole(address, null);
            }
          } else {
            setRole(null);
            setIsRegistered(false);
            setCachedRole(address, null);
          }
        }
      } catch (error) {
        console.error('Error loading role from blockchain:', error);
        if (!getCachedRole(address || '')) {
          setRole(null);
          setIsRegistered(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, [isConnected, address, africycle]);

  const value = {
    role,
    setRole: (newRole: Role) => {
      setRole(newRole);
      if (address) {
        setCachedRole(address, newRole);
      }
    },
    isLoading,
    isRegistered
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export { RoleContext };

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
} 
