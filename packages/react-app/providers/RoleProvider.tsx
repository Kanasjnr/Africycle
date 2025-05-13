"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useAfriCycle } from '@/hooks/useAfricycle';

export type Role = 'collector' | 'collection_point' | 'recycler' | 'corporate_partner' | null;

// Role mapping from bytes32 to human-readable roles
// These values should match the keccak256 hashes of the role names in the contract
const ROLE_MAPPING: { [key: string]: Role } = {
  // keccak256("COLLECTOR_ROLE")
  '0x636f6c6c6563746f720000000000000000000000000000000000000000000000': 'collector',
  // keccak256("COLLECTION_POINT_ROLE")
  '0x636f6c6c656374696f6e5f706f696e7400000000000000000000000000000000': 'collection_point',
  // keccak256("RECYCLER_ROLE")
  '0x72656379636c6572000000000000000000000000000000000000000000000000': 'recycler',
  // keccak256("CORPORATE_PARTNER_ROLE")
  '0x636f72706f726174655f706172746e6572000000000000000000000000000000': 'corporate_partner',
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
        // Only try to get role from blockchain if connected
        if (isConnected && address && africycle) {
          const blockchainRole = await africycle.getUserRole(address);
          console.log("Blockchain role:", blockchainRole);
          
          // Check if the role is a zero bytes32 value (unregistered)
          const isZeroRole = blockchainRole === "0x0000000000000000000000000000000000000000000000000000000000000000";
          
          if (!isZeroRole) {
            const humanReadableRole = ROLE_MAPPING[blockchainRole.toLowerCase()];
            console.log("Converted to human-readable role:", humanReadableRole);
            
            if (humanReadableRole) {
              setRole(humanReadableRole);
              setIsRegistered(true);
            } else {
              console.warn("Unknown role type from blockchain:", blockchainRole);
              setRole(null);
              setIsRegistered(false);
            }
          } else {
            console.log("User has no role on blockchain");
            setRole(null);
            setIsRegistered(false);
          }
        } else {
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