'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useRole, type Role } from '@/providers/RoleProvider';
import { useAccount } from 'wagmi';
import { useChainId, useSwitchChain } from 'wagmi';
import { Loader2 } from 'lucide-react';
import { celo } from 'viem/chains';
// Import the standard AfriCycle hook
import { useAfriCycle } from '@/hooks/useAfricycle';
// Import email service
import { EmailService } from '@/lib/email-service';

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL;

if (!CONTRACT_ADDRESS || !RPC_URL) {
  throw new Error(
    'Missing required environment variables: NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS or NEXT_PUBLIC_CELO_RPC_URL'
  );
}

// Type assertion after validation
const CONTRACT_ADDRESS_SAFE = CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL_SAFE = RPC_URL as string;

const registrationSchema = z.object({
  role: z.enum(
    ['collector', 'recycler'],
    {
      required_error: 'Please select a role',
    }
  ),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

export function RegistrationDialog() {
  const [open, setOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [isSwitchingChain, setIsSwitchingChain] = useState(false);
  const router = useRouter();
  const { setRole, role } = useRole();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Initialize AfriCycle hook at the top level
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS_SAFE,
    rpcUrl: RPC_URL_SAFE,
  });

  // Initialize form at the top level
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      role: 'collector',
      name: '',
      email: '',
      location: '',
    },
  });

  // Check if user is already registered
  useEffect(() => {
    async function checkRegistration() {
      console.log('Starting registration check...', {
        isConnected,
        address,
        hasAfricycle: !!africycle
      });

      if (!isConnected || !address || !africycle) {
        console.log('Early return - missing requirements:', {
          isConnected,
          hasAddress: !!address,
          hasAfricycle: !!africycle
        });
        setIsCheckingRegistration(false);
        return;
      }

      try {
        // Check if user has a role
        console.log('Checking user role for address:', address);
        const blockchainRole = await africycle.getUserRole(address);
        console.log('Blockchain role:', blockchainRole);

        // Check if the role is a zero bytes32 value (unregistered)
        const isZeroRole =
          blockchainRole ===
          '0x0000000000000000000000000000000000000000000000000000000000000000';
        console.log('Is zero role:', isZeroRole);

        if (!isZeroRole) {
          // User has a role, convert it to human-readable format
          const roleMapping: { [key: string]: Role } = {
            // keccak256("COLLECTOR_ROLE")
            '0x14cf45180c3fcf249a5a305e9657ea05c14fd4f4e1800ee0216a8213091711d2': 'collector',
            // keccak256("RECYCLER_ROLE")
            '0x11d2c681bc9c10ed61f9a422c0dbaaddc4054ce58ec726aca73e7e4d31bcd154': 'recycler',
          };

          const humanReadableRole = roleMapping[blockchainRole.toLowerCase()];
          console.log('Human readable role:', humanReadableRole);

          if (humanReadableRole) {
            // Check if profile exists by trying to get user profile
            try {
              console.log('Checking user profile...');
              const userProfile = await africycle.getUserProfile(address);
              console.log('User profile exists:', userProfile);
              // If we get here, profile exists
              setRole(humanReadableRole);
              router.push('/dashboard');
            } catch (profileError) {
              // Profile doesn't exist or is not initialized
              console.log('Profile check failed:', profileError);
              console.log('User has role but profile is not initialized. Showing registration dialog.');
              setRole(humanReadableRole); // Keep the role
              setOpen(true); // Show registration dialog
            }
          } else {
            console.log('No human readable role found, showing registration dialog');
            setOpen(true);
          }
        } else {
          console.log('User has no role, showing registration dialog');
          setOpen(true);
        }
      } catch (error) {
        console.error('Error checking registration:', error);
        // If there's an error, we'll show the registration dialog anyway
        console.log('Error occurred, showing registration dialog');
        setOpen(true);
      } finally {
        setIsCheckingRegistration(false);
      }
    }

    checkRegistration();
  }, [isConnected, address, router, setRole, africycle]);

  // Add debug log for render conditions
  console.log('RegistrationDialog render state:', {
    isCheckingRegistration,
    isConnected,
    hasAfricycle: !!africycle,
    isOpen: open,
    currentRole: role
  });

  // Don't show anything while checking registration
  if (isCheckingRegistration) {
    console.log('Not rendering - still checking registration');
    return null;
  }

  // Don't show the dialog if wallet is not connected or africycle is not initialized
  if (!isConnected || !africycle) {
    console.log('Not rendering - missing requirements:', {
      isConnected,
      hasAfricycle: !!africycle
    });
    return null;
  }

  async function onSubmit(data: RegistrationFormValues) {
    try {
      if (!address || !africycle) {
        toast.error('Please connect your wallet first');
        return;
      }

      // Validate form data
      if (!data.name || !data.location || !data.email) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Check if we're on the correct chain
      if (chainId !== celo.id) {
        setIsSwitchingChain(true);
        toast.info('Please switch to Celo network in your wallet...');
        
        try {
          // Attempt to switch to Celo network
          await switchChain?.({ 
            chainId: celo.id,
            addEthereumChainParameter: {
              chainName: 'Celo',
              nativeCurrency: {
                name: 'CELO',
                symbol: 'CELO',
                decimals: 18,
              },
              rpcUrls: [process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org'],
              blockExplorerUrls: ['https://explorer.celo.org'],
            }
          });
          
          // Wait longer for the chain switch to complete and network to stabilize
          await new Promise((resolve) => setTimeout(resolve, 5000));
          
          // Get the current chain ID after waiting
          const currentChainId = await window.ethereum?.request({ method: 'eth_chainId' });
          const parsedChainId = currentChainId ? parseInt(currentChainId, 16) : null;
          
          if (parsedChainId !== celo.id) {
            toast.error(
              'Please switch to Celo network manually in your wallet. ' +
              'If you don\'t see Celo in your wallet, you may need to add it as a custom network.'
            );
            setIsSwitchingChain(false);
            return;
          }
        } catch (error) {
          console.error('Error switching network:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast.error(
            'Failed to switch network. ' +
            'Please switch to Celo manually in your wallet. ' +
            'If you don\'t see Celo in your wallet, you may need to add it as a custom network. ' +
            `Error: ${errorMessage}`
          );
          setIsSwitchingChain(false);
          return;
        } finally {
          setIsSwitchingChain(false);
        }
      }

      setIsRegistering(true);

      // Use the appropriate registration function based on the selected role
      let txHash;

      switch (data.role) {
        case 'collector':
          txHash = await africycle.registerCollector(
            address,
            data.name,
            data.location,
            data.email
          );
          break;

        case 'recycler':
          txHash = await africycle.registerRecycler(
            address,
            data.name,
            data.location,
            data.email
          );
          break;

        default:
          throw new Error('Invalid role selected');
      }

      // Wait for the transaction to be mined and role to be updated
      toast.success(
        'Registration transaction submitted! Waiting for confirmation...'
      );

      // Send welcome email using EmailJS (don't wait for it to complete)
      EmailService.sendWelcomeEmail({
        userType: data.role,
        userName: data.name,
        userEmail: data.email,
        walletAddress: address,
      }).then((success) => {
        if (success) {
          console.log('Welcome email sent successfully via EmailJS');
        } else {
          console.log('Welcome email failed to send via EmailJS');
        }
      }).catch((error) => {
        console.log('Welcome email error:', error);
      });

      // Close the dialog
      setOpen(false);

      // Wait a bit for the blockchain to update
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to role-specific dashboard
      switch (data.role) {
        case 'collector':
          router.push('/dashboard/collector');
          break;
        case 'recycler':
          router.push('/dashboard/recycler');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Registration failed. Please try again.'
      );
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {role ? 'Complete Your Profile' : 'Complete Your Registration'}
          </DialogTitle>
          <DialogDescription>
            {role
              ? 'Your account has a role but needs a profile. Please provide your details to complete your profile.'
              : 'Please provide your details to register on the AfriCycle platform.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="collector">Waste Collector</SelectItem>
                      <SelectItem value="recycler">Recycler (Collection Point & Processing)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isRegistering || isSwitchingChain}
            >
              {isSwitchingChain ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Switching to Celo Network...
                </>
              ) : isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering on Blockchain...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              This will create a transaction on the Celo blockchain to register
              your account.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}