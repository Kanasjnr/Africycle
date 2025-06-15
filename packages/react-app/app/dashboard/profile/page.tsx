'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useAfriCycle } from '@/hooks/useAfricycle';
import { UserProfileView, AfricycleStatus } from '@/hooks/useAfricycle';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  IconUser,
  IconLocation,
  IconPhone,
  IconCalendar,
  IconShield,
  IconTrophy,
  IconRecycle,
  IconCoins,
  IconPackage,
  IconTruck,
  IconUsers,
  IconEdit,
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconX,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { formatUnits } from 'viem';

export default function ProfilePage() {
  const { address } = useAccount();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const africycle = useAfriCycle({
    contractAddress: process.env
      .NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!address || !africycle) return;

      try {
        setLoading(true);
        setError(null);
        const userProfile = await africycle.getUserProfile(address);
        setProfile(userProfile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [address, africycle]);

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatBigIntValue = (value: bigint, decimals: number = 18) => {
    return parseFloat(formatUnits(value, decimals)).toFixed(2);
  };

  const getStatusBadge = (status: AfricycleStatus) => {
    switch (status) {
      case AfricycleStatus.VERIFIED:
        return (
          <Badge
            variant="default"
            className="bg-emerald-100 text-emerald-800 border-emerald-200"
          >
            <IconCheck className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        );
      case AfricycleStatus.PENDING:
        return (
          <Badge
            variant="secondary"
            className="bg-amber-100 text-amber-800 border-amber-200"
          >
            <IconClock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case AfricycleStatus.REJECTED:
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 border-red-200"
          >
            <IconX className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case AfricycleStatus.ACTIVE:
        return (
          <Badge
            variant="default"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            Active
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const wasteTypeLabels = ['Plastic', 'E-Waste', 'Metal', 'General'];

  // Role mapping from bytes32 to human-readable roles
  const ROLE_MAPPING: { [key: string]: string } = {
    // keccak256("COLLECTOR_ROLE")
    '0x14cf45180c3fcf249a5a305e9657ea05c14fd4f4e1800ee0216a8213091711d2':
      'collector',
    // keccak256("RECYCLER_ROLE")
    '0x11d2c681bc9c10ed61f9a422c0dbaaddc4054ce58ec726aca73e7e4d31bcd154':
      'recycler',
  };

  const getUserRole = (roleHex: string): string => {
    const normalizedHex = roleHex.toLowerCase();
    return ROLE_MAPPING[normalizedHex] || 'unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto p-6 space-y-8">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex justify-center">
            <Skeleton className="h-96 w-full max-w-md rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Profile</h1>
          </div>
          <Card className="shadow-lg">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <IconUser className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">
                  {error || 'Profile not found'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full"
            >
              <IconArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Profile Overview
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your account and view your information
              </p>
            </div>
          </div>
          <Button variant="outline" size="lg" className="shadow-sm">
            <IconEdit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        {/* Profile Card - Centered */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                    <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-green-400 to-blue-500 text-white">
                      {profile.name
                        ? profile.name.charAt(0).toUpperCase()
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl">
                  {profile.name || 'Anonymous User'}
                </CardTitle>
                <CardDescription className="text-sm">
                  Member since {formatTimestamp(profile.registrationDate)}
                </CardDescription>
                <div className="flex justify-center mt-3">
                  {getStatusBadge(profile.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <IconLocation className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Location
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.location || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <IconPhone className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Contact
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.contactInfo || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <IconShield className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Verification
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile.isVerified
                          ? 'Verified Account'
                          : 'Pending Verification'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-900 mb-3">
                    Roles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {getUserRole(profile.role) === 'collector' && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <IconRecycle className="h-3 w-3 mr-1" />
                        Collector
                      </Badge>
                    )}
                    {getUserRole(profile.role) === 'recycler' && (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        <IconPackage className="h-3 w-3 mr-1" />
                        Recycler
                      </Badge>
                    )}
                    {getUserRole(profile.role) === 'unknown' && (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-700 border-gray-200"
                      >
                        <IconUser className="h-3 w-3 mr-1" />
                        Unknown Role
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
