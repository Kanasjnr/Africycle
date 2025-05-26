"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAfriCycle } from '@/hooks/useAfricycle';

export type Role = 'collector' | 'collection_point' | 'recycler' | 'corporate_partner' | null;

// Role mapping from bytes32 to human-readable roles
// These values should match the keccak256 hashes of the role names in the contract
const ROLE_MAPPING: { [key: string]: Role } = {
  // keccak256("COLLECTOR_ROLE")
  '0x14cf45180c3fcf249a5a305e9657ea05c14fd4f4e1800ee0216a8213091711d2': 'collector',
  // keccak256("COLLECTION_POINT_ROLE")
  '0xbfaa47f03b044d665fdcdc16f750c4b3b3aac1139fdcc9d487a720b0f072e4f7': 'collection_point',
  // keccak256("RECYCLER_ROLE")
  '0x11d2c681bc9c10ed61f9a422c0dbaaddc4054ce58ec726aca73e7e4d31bcd154': 'recycler',
  // keccak256("CORPORATE_ROLE")
  '0x636f72706f726174650000000000000000000000000000000000000000000000': 'corporate_partner',
};

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  isLoading: boolean;
  isRegistered: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

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

  useEffect(() => {
    const loadRole = async () => {
      try {
        console.log("RoleProvider - Starting role load")
        console.log("RoleProvider - Connection state:", { isConnected, address })
        
        // Only try to get role from blockchain if connected
        if (isConnected && address && africycle) {
          console.log("RoleProvider - Fetching role from blockchain")
          const blockchainRole = await africycle.getUserRole(address);
          console.log("RoleProvider - Raw blockchain role:", blockchainRole)
          
          // Check if the role is a zero bytes32 value (unregistered)
          const isZeroRole = blockchainRole === "0x0000000000000000000000000000000000000000000000000000000000000000";
          console.log("RoleProvider - Is zero role:", isZeroRole)
          
          if (!isZeroRole) {
            const humanReadableRole = ROLE_MAPPING[blockchainRole.toLowerCase()];
            console.log("RoleProvider - Mapped role:", humanReadableRole)
            
            if (humanReadableRole) {
              setRole(humanReadableRole);
              setIsRegistered(true);
            } else {
              console.log("RoleProvider - No mapping found for role:", blockchainRole)
              setRole(null);
              setIsRegistered(false);
            }
          } else {
            console.log("RoleProvider - User has no role (zero role)")
            setRole(null);
            setIsRegistered(false);
          }
        } else {
          console.log("RoleProvider - Not connected or missing address/africycle:", { isConnected, hasAddress: !!address, hasAfricycle: !!africycle })
          // If not connected, clear any existing role
          setRole(null);
          setIsRegistered(false);
        }
      } catch (error) {
        console.error('Error loading role from blockchain:', error);
        setRole(null);
        setIsRegistered(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, [isConnected, address, africycle]);

  const value = {
    role,
    setRole,
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
