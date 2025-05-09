"use client";

import { createContext, useContext, useState, useEffect } from 'react';

export type Role = 'collector' | 'collection_point' | 'recycler' | 'corporate_partner' | null;

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

  useEffect(() => {
    const loadRole = async () => {
      try {
        const savedRole = localStorage.getItem('userRole') as Role;
        if (savedRole) {
          setRole(savedRole);
          setIsRegistered(true);
        }
      } catch (error) {
        console.error('Error loading role:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRole();
  }, []);

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