'use client';

import { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react';
import { Header } from '@/components/dashboard/header';
import { DashboardShell } from '@/components/dashboard/shell';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  IconUpload,
  IconPhoto,
  IconCheck,
  IconCamera,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import {
  useAfriCycle,
  AfricycleStatus,
  AfricycleWasteStream,
  AfricycleQualityGrade,
  WasteCollection,
} from '@/hooks/useAfricycle';
import { useAccount, useWalletClient } from 'wagmi';
import {
  cloudinaryConfig,
  getCloudinaryConfig,
  CloudinaryUploadResult,
} from '@/lib/cloudinary';
import Image from 'next/image';
import {
  parseEther,
  formatEther,
  createPublicClient,
  http,
  PublicClient,
  type Hash,
  getContract,
} from 'viem';
import { celo } from 'viem/chains';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconSearch,
} from '@tabler/icons-react';
import afriCycleAbi from '@/ABI/Africycle.json';

// Rename local config to avoid conflict with imported one
const cloudinaryImageConfig = {
  cloudName: 'dn2ed9k6p',
  baseUrl: 'https://res.cloudinary.com/dn2ed9k6p/image/upload'
};

// Add a fallback image component
const FallbackImage = ({ alt }: { alt: string }) => (
  <div className="flex items-center justify-center w-full h-48 bg-gray-100 rounded-lg">
    <div className="text-gray-400">
      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <p className="mt-2 text-sm">Image not available</p>
    </div>
  </div>
);

// Update the getCloudinaryImageUrl function to use the renamed config
const getCloudinaryImageUrl = (publicId: string) => {
  return `${cloudinaryImageConfig.baseUrl}/${publicId}`;
};

// Define the contract configuration
const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL =
  process.env.NEXT_PUBLIC_CELO_RPC_URL || 'https://forno.celo.org';

// Add debug logging for contract configuration
console.log('Verification Page Contract Config:', {
  contractAddress: CONTRACT_ADDRESS,
  rpcUrl: RPC_URL,
  envContractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS,
});

// Update the getRoleHash function to use the imported ABI
const getRoleHash = async (africycle: any, roleName: 'RECYCLER_ROLE' | 'COLLECTOR_ROLE' | 'ADMIN_ROLE') => {
  if (!africycle?.publicClient || !africycle?.contractAddress) {
    console.error('Africycle client not properly initialized');
    throw new Error('Africycle client not properly initialized');
  }

  try {
    const roleHash = await africycle.publicClient.readContract({
      address: africycle.contractAddress,
      abi: afriCycleAbi,
      functionName: roleName
    });
    return roleHash;
  } catch (error) {
    console.error(`Error getting ${roleName}:`, error);
    throw error;
  }
};

// Define types for collections
interface Collection {
  collectionId: number;
  collector: string;
  wasteType: AfricycleWasteStream;
  weight: bigint;
  location: string;
  imageHash: string;
  status: AfricycleStatus;
  timestamp: bigint;
  quality: AfricycleQualityGrade;
  rewardAmount: bigint;
  isProcessed: boolean;
  imageUrl: string; // Computed field for display
}

interface CollectionsState {
  collections: Collection[];
}

interface AppState {
  loading: boolean;
  collections: Collection[];
  form: {
    uploading: boolean;
    submitting: boolean;
    selectedImage: string | null;
    imageHash: string | null;
    weight: string;
    wasteType: AfricycleWasteStream;
    location: string;
    pickupTime: number;
    recycler: `0x${string}`;
  };
}

// Update the Recycler interface to match contract data
interface Recycler {
  address: `0x${string}`;
  name: string;
  location: string;
  contactInfo: string;
  isVerified: boolean;
  reputationScore: bigint;
  totalInventory: bigint;
  activeListings: bigint;
}

// Add a loading skeleton component
const CollectionSkeleton = memo(() => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4 animate-pulse">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
      <div className="h-24 w-24 sm:h-16 sm:w-16 rounded-lg bg-muted shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-3 w-32 bg-muted rounded" />
        <div className="h-3 w-40 bg-muted rounded" />
      </div>
    </div>
    <div className="w-full sm:w-auto">
      <div className="h-9 w-24 bg-muted rounded" />
    </div>
  </div>
));
CollectionSkeleton.displayName = 'CollectionSkeleton';

// Update the CollectionItem component to use navigation
const CollectionItem = memo(
  ({
    collection,
    timeAgo,
    isLoading = false,
  }: {
    collection: Collection;
    timeAgo: (timestamp: bigint) => string;
    isLoading?: boolean;
  }) => {
    const router = useRouter();
    const imageUrl = useMemo(
      () =>
        collection.imageHash
          ? getCloudinaryImageUrl(collection.imageHash)
          : '/placeholder.svg',
      [collection.imageHash]
    );

    if (isLoading) {
      return <CollectionSkeleton />;
    }

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div className="h-24 w-24 sm:h-16 sm:w-16 rounded-lg bg-muted overflow-hidden relative shrink-0">
            {collection.imageHash ? (
              <Image
                src={imageUrl}
                alt="Collection"
                fill
                className="object-cover"
                sizes="(max-width: 96px) 96px, 64px"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <IconPhoto className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              Collection #{collection.collectionId}
            </p>
            <p className="text-sm text-muted-foreground">
              Created {timeAgo(collection.timestamp)}
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {AfricycleWasteStream[collection.wasteType]} •{' '}
              {collection.weight.toString()} kg
            </p>
            <p className="text-sm text-muted-foreground truncate">
              {collection.location}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(
                `/dashboard/collector/verification/${collection.collectionId}`
              )
            }
            className="w-full sm:w-auto"
          >
            View Details
          </Button>
        </div>
      </div>
    );
  }
);
CollectionItem.displayName = 'CollectionItem';

// Add this constant at the top of the file after imports
const MAX_COLLECTION_WEIGHT = 1000; // Maximum weight in kg

// Add this function before the PhotoVerificationPage component
const uploadToCloudinary = async (
  file: File
): Promise<CloudinaryUploadResult> => {
  // Get fresh config values
  const config = getCloudinaryConfig();

  if (!config.cloudName) {
    throw new Error(
      'Invalid Cloudinary cloud name. Please check your environment variables.'
    );
  }

  if (!config.uploadPreset) {
    throw new Error(
      'Cloudinary upload preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', config.uploadPreset);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
      validateStatus: (status) => status === 200,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      `Failed to upload image: ${
        error.response?.data?.error?.message || error.message
      }`
    );
  }
};

// Define the raw collection data type from smart contract
type RawCollectionData = [
  bigint, // id
  string, // collector
  number, // status
  bigint, // weight
  string, // location
  string, // imageHash
  number, // wasteType
  bigint, // timestamp
  number, // quality
  bigint, // earnings
  boolean // isVerified
];

// Update the type guard for collection data
const isValidCollectionData = (data: unknown): data is RawCollectionData => {
  // Check if data is an array with at least 7 elements (minimum required fields)
  if (!Array.isArray(data) || data.length < 7) {
    console.log('Debug: Data is not an array or too short:', data);
    return false;
  }

  // Check if required fields exist and have valid types
  const [
    id,
    collector,
    status,
    weight,
    location,
    imageHash,
    wasteType,
    timestamp,
    quality,
    earnings,
    isVerified,
  ] = data as RawCollectionData;

  // Basic type checks for required fields
  return (
    typeof collector === 'string' &&
    typeof status === 'number' &&
    typeof wasteType === 'number' &&
    typeof timestamp === 'bigint' &&
    typeof weight === 'bigint' &&
    typeof location === 'string' &&
    typeof imageHash === 'string'
  );
};

// Update helper function to convert array data to Collection object
const arrayToCollection = (data: unknown, id: number): Collection | null => {
  if (!isValidCollectionData(data)) {
    console.error(`Debug: Invalid collection data format for #${id}:`, data);
    return null;
  }

  // Skip empty collections (where collector is zero address)
  if (data[1] === '0x0000000000000000000000000000000000000000') {
    console.log(`Debug: Skipping empty collection #${id}`);
    return null;
  }

  // Destructure the data array according to the contract's WasteCollection struct
  const [
    _id, // uint256 id
    collector, // address collector
    wasteType, // WasteStream wasteType
    weight, // uint256 weight
    location, // string location
    imageHash, // string imageHash
    status, // Status status
    timestamp, // uint256 timestamp
    quality, // QualityGrade quality
    rewardAmount, // uint256 rewardAmount
    isProcessed, // bool isProcessed
  ] = data as any[];

  return {
    collectionId: id,
    collector,
    wasteType,
    weight,
    location,
    imageHash,
    status,
    timestamp,
    quality,
    rewardAmount,
    isProcessed,
    imageUrl: imageHash
      ? `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${imageHash}`
      : '',
  };
};

// Add these types after the existing interfaces
type SortField = 'timestamp' | 'weight' | 'rewardAmount';
type SortOrder = 'asc' | 'desc';
type FilterStatus = AfricycleStatus | 'ALL';

interface CollectionFilters {
  status: FilterStatus;
  wasteType: AfricycleWasteStream | 'ALL';
  search: string;
  sortField: SortField;
  sortOrder: SortOrder;
}

// Add this component before PhotoVerificationPage
const CollectionSummary = memo(
  ({ collections }: { collections: Collection[] }) => {
    const totalCollections = collections.length;
    const totalWeight = collections.reduce(
      (sum, c) => sum + Number(c.weight),
      0
    );
    const totalEarnings = collections.reduce(
      (sum, c) => sum + Number(c.rewardAmount),
      0
    );
    const verifiedCollections = collections.filter(
      (c) => c.status === AfricycleStatus.VERIFIED
    ).length;

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Total Collections
            </p>
            <p className="text-2xl font-bold">{totalCollections}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Total Weight
            </p>
            <p className="text-2xl font-bold">{totalWeight.toFixed(2)} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </p>
            <p className="text-2xl font-bold">
              {formatEther(BigInt(totalEarnings))} cUSD
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Verified Collections
            </p>
            <p className="text-2xl font-bold">{verifiedCollections}</p>
          </CardContent>
        </Card>
      </div>
    );
  }
);
CollectionSummary.displayName = 'CollectionSummary';

// Add this component before PhotoVerificationPage
const CollectionFilters = memo(
  ({
    filters,
    onFilterChange,
  }: {
    filters: CollectionFilters;
    onFilterChange: (filters: CollectionFilters) => void;
  }) => {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status.toString()}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                status: Number(value) as FilterStatus,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              {Object.entries(AfricycleStatus)
                .filter(([key]) => isNaN(Number(key)))
                .map(([key, value]) => (
                  <SelectItem key={key} value={value.toString()}>
                    {key}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Waste Type</label>
          <Select
            value={filters.wasteType.toString()}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                wasteType: Number(value) as AfricycleWasteStream | 'ALL',
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {Object.entries(AfricycleWasteStream)
                .filter(([key]) => isNaN(Number(key)))
                .map(([key, value]) => (
                  <SelectItem key={key} value={value.toString()}>
                    {key}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sort By</label>
          <Select
            value={filters.sortField}
            onValueChange={(value) =>
              onFilterChange({ ...filters, sortField: value as SortField })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timestamp">Date</SelectItem>
              <SelectItem value="weight">Weight</SelectItem>
              <SelectItem value="rewardAmount">Reward</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              value={filters.search}
              onChange={(e) =>
                onFilterChange({ ...filters, search: e.target.value })
              }
              className="pl-8"
            />
          </div>
        </div>
      </div>
    );
  }
);
CollectionFilters.displayName = 'CollectionFilters';

// Add known recycler addresses
const KNOWN_RECYCLERS = [
  "0xF69B06cc7637c5742668a932F7eD1780742D4D78",
  "0x817c19bD1Ba4eD47e180a3219d12d1462C8fABDC"
] as const

// Update where images are rendered (find the Image component usage and replace with this)
const ImageWithFallback = ({ src, alt, width = 828, height = 552 }: { 
  src: string; 
  alt: string; 
  width?: number; 
  height?: number;
}) => {
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (error) {
    return <FallbackImage alt={alt} />;
  }

  return (
    <div className="relative w-full h-48">
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover rounded-lg transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onError={() => setError(true)}
        onLoadingComplete={() => setIsLoading(false)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={75}
        priority={false}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default function PhotoVerificationPage() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();

  // Initialize the AfriCycle hook with only the required parameters
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL
  });

  // Add loading state for hook initialization
  const [isHookReady, setIsHookReady] = useState(false);

  // Effect to handle hook initialization
  useEffect(() => {
    if (address && walletClient && africycle) {
      setIsHookReady(true);
    } else {
      setIsHookReady(false);
    }
  }, [address, walletClient, africycle]);

  // Update state to include hook loading state
  const [state, setState] = useState<AppState>({
    loading: true,
    collections: [],
    form: {
      uploading: false,
      submitting: false,
      selectedImage: null,
      imageHash: null,
      weight: '',
      wasteType: AfricycleWasteStream.PLASTIC,
      location: '',
      pickupTime: Math.floor(Date.now() / 1000) + 86400, // Default to 24 hours from now
      recycler: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    },
  });

  // Create public client - memoize to prevent recreation
  const publicClient = useMemo(
    () =>
      createPublicClient({
        chain: celo,
        transport: http(RPC_URL),
      }) as PublicClient,
    []
  );

  const [loadingCollections, setLoadingCollections] = useState<Set<number>>(
    new Set()
  );
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Move handleFormChange before it's used
  const handleFormChange = useCallback(
    (field: keyof typeof state.form, value: any) => {
      setState((prev) => ({
        ...prev,
        form: { ...prev.form, [field]: value },
      }));
    },
    []
  );

  // Update handleImageUpload to use handleFormChange
  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        setState((prev) => ({
          ...prev,
          form: { ...prev.form, uploading: true },
        }));

        const result = await uploadToCloudinary(file);
        handleFormChange('selectedImage', result.secure_url);
        // Store the public_id for later use
        handleFormChange('imageHash', result.public_id);

        toast.success('Image uploaded successfully');
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.error('Failed to upload image');
      } finally {
        setState((prev) => ({
          ...prev,
          form: { ...prev.form, uploading: false },
        }));
      }
    },
    [handleFormChange]
  );

  // Update fetchCollections to use the hook properly
  const fetchCollections = useCallback(async () => {
    if (!address || !africycle || !isHookReady) {
      console.log('Debug: fetchCollections - Missing requirements:', {
        hasAddress: !!address,
        hasAfricycle: !!africycle,
        isHookReady,
      });
      setIsInitialLoading(false);
      return;
    }

    try {
      console.log('Debug: Starting to fetch collections for address:', address);
      setIsInitialLoading(true);
      setFetchError(null);

      const collections: Collection[] = [];
      let currentId = 0;
      const MAX_ATTEMPTS = 100; // Safety limit

      while (currentId < MAX_ATTEMPTS) {
        try {
          const data = await africycle.getCollectionDetails(BigInt(currentId));
          if (
            data.collection.collector ===
            '0x0000000000000000000000000000000000000000'
          )
            break;
          if (
            data.collection.collector.toLowerCase() === address.toLowerCase()
          ) {
            const collection = arrayToCollection(data.collection, currentId);
            if (collection) collections.push(collection);
          }
          currentId++;
        } catch (error) {
          console.log(`Debug: End of collections at ID ${currentId}`);
          break;
        }
      }

      setState((prev) => ({ ...prev, collections }));
    } catch (error) {
      console.error('Debug: Error in fetchCollections:', error);
      setFetchError(
        error instanceof Error ? error.message : 'Failed to fetch collections'
      );
      toast.error('Failed to fetch collections');
    } finally {
      setIsInitialLoading(false);
    }
  }, [address, africycle, isHookReady]);

  // Memoize utility functions
  const formatDate = useCallback((timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  }, []);

  const timeAgo = useCallback((timestamp: bigint) => {
    const seconds = Math.floor(Date.now() / 1000) - Number(timestamp);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }, []);

  // Add a memoized version of the collections list to prevent unnecessary re-renders
  const collectionsList = useMemo(() => {
    return state.collections.map((collection) => (
      <CollectionItem
        key={collection.collectionId}
        collection={collection}
        timeAgo={timeAgo}
        isLoading={loadingCollections.has(collection.collectionId)}
      />
    ));
  }, [state.collections, loadingCollections, timeAgo]);

  // Update handleSubmit to check recycler role before submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!address || !africycle || !isHookReady || !state.form.imageHash) {
        toast.error('Please connect your wallet and complete all required fields');
        return;
      }

      try {
        // Add debug logging for recycler role check
        console.log('Debug: Checking recycler role before submission:', {
          recycler: state.form.recycler,
          roleHash: await getRoleHash(africycle, 'RECYCLER_ROLE')
        });

        const recyclerRole = await getRoleHash(africycle, 'RECYCLER_ROLE');
        console.log('Debug: Recycler role from contract:', {
          recycler: state.form.recycler,
          role: recyclerRole,
          expectedRole: recyclerRole,
          isMatch: recyclerRole === await getRoleHash(africycle, 'RECYCLER_ROLE')
        });

        if (recyclerRole !== await getRoleHash(africycle, 'RECYCLER_ROLE')) {
          throw new Error(`Selected recycler does not have the correct role. Role: ${recyclerRole}, Expected: ${await getRoleHash(africycle, 'RECYCLER_ROLE')}`);
        }

        console.log('Debug: Starting collection submission with data:', {
          address,
          wasteType: state.form.wasteType,
          weight: state.form.weight,
          location: state.form.location,
          imageHash: state.form.imageHash,
          pickupTime: state.form.pickupTime,
          recycler: state.form.recycler,
          hasAfricycle: !!africycle,
          isHookReady,
        });

        setState((prev) => ({
          ...prev,
          form: { ...prev.form, submitting: true },
        }));

        const weight = parseFloat(state.form.weight);
        if (isNaN(weight) || weight <= 0) {
          throw new Error('Please enter a valid weight greater than 0');
        }

        if (weight > MAX_COLLECTION_WEIGHT) {
          throw new Error(
            `Weight exceeds maximum allowed limit of ${MAX_COLLECTION_WEIGHT} kg`
          );
        }

        if (!state.form.location.trim()) {
          throw new Error('Please enter a valid location');
        }

        if (
          !state.form.recycler ||
          state.form.recycler === '0x0000000000000000000000000000000000000000'
        ) {
          throw new Error('Please select a recycler');
        }

        // Ensure recycler is a valid hex address
        if (!/^0x[a-fA-F0-9]{40}$/.test(state.form.recycler)) {
          throw new Error('Invalid recycler address format');
        }

        // Create the collection using the hook
        const hash = await africycle.createCollection(
          address,
          state.form.wasteType,
          weight,
          state.form.location,
          state.form.imageHash,
          state.form.pickupTime,
          state.form.recycler
        );

        console.log('Debug: Collection creation transaction hash:', hash);

        // Wait for transaction to be mined
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Debug: Transaction receipt:', receipt);

        toast.success('Collection created successfully!');

        // Reset form
        setState((prev) => ({
          ...prev,
          form: {
            uploading: false,
            submitting: false,
            selectedImage: null,
            imageHash: null,
            weight: '',
            wasteType: AfricycleWasteStream.PLASTIC,
            location: '',
            pickupTime: Math.floor(Date.now() / 1000) + 86400,
            recycler:
              '0x0000000000000000000000000000000000000000' as `0x${string}`,
          },
        }));

        // Refresh collections
        await fetchCollections();
      } catch (error) {
        console.error('Error creating collection:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to create collection'
        );
      } finally {
        setState((prev) => ({
          ...prev,
          form: { ...prev.form, submitting: false },
        }));
      }
    },
    [
      address,
      africycle,
      isHookReady,
      state.form,
      fetchCollections,
      publicClient,
    ]
  );

  // Update the submit button to show wallet connection state
  const submitButtonDisabled =
    !isHookReady ||
    state.form.submitting ||
    !state.form.imageHash ||
    !state.form.weight ||
    !state.form.location;

  const submitButtonText = !isHookReady
    ? 'Connect Wallet'
    : state.form.submitting
    ? 'Submitting...'
    : 'Submit Collection';

  // Use a ref to track if we've already fetched collections
  const hasFetchedRef = useRef(false);

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      if (!hasFetchedRef.current) {
        console.log('Debug: Starting initial fetch');
        hasFetchedRef.current = true;
        await fetchCollections();
      }
    };
    fetchData();
  }, [fetchCollections]);

  // Add error state
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('new');
  const [filters, setFilters] = useState<CollectionFilters>({
    status: 'ALL',
    wasteType: 'ALL',
    search: '',
    sortField: 'timestamp',
    sortOrder: 'desc',
  });

  // Add this function to filter and sort collections
  const filteredCollections = useMemo(() => {
    return state.collections
      .filter((collection) => {
        if (filters.status !== 'ALL' && collection.status !== filters.status)
          return false;
        if (
          filters.wasteType !== 'ALL' &&
          collection.wasteType !== filters.wasteType
        )
          return false;
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            collection.location.toLowerCase().includes(searchLower) ||
            collection.collectionId.toString().includes(searchLower) ||
            AfricycleWasteStream[collection.wasteType]
              .toLowerCase()
              .includes(searchLower)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
        switch (filters.sortField) {
          case 'timestamp':
            return multiplier * (Number(a.timestamp) - Number(b.timestamp));
          case 'weight':
            return multiplier * (Number(a.weight) - Number(b.weight));
          case 'rewardAmount':
            return (
              multiplier * (Number(a.rewardAmount) - Number(b.rewardAmount))
            );
          default:
            return 0;
        }
      });
  }, [state.collections, filters]);

  // Add state for recyclers
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  const [loadingRecyclers, setLoadingRecyclers] = useState(true);

  // Update fetchRecyclers function
  const fetchRecyclers = useCallback(async () => {
    if (!africycle || !isHookReady) {
      console.log('Debug: fetchRecyclers - Missing requirements:', {
        hasAfricycle: !!africycle,
        isHookReady,
        africycleInstance: africycle
      })
      return
    }

    try {
      console.log('Debug: Starting to fetch recyclers')
      setLoadingRecyclers(true)
      const recyclersList: Recycler[] = []
      
      // Check known recycler addresses
      console.log('Debug: Checking known recycler addresses:', KNOWN_RECYCLERS)
      
      for (const address of KNOWN_RECYCLERS) {
        try {
          console.log(`Debug: Checking recycler address:`, address)
          const profile = await africycle.getUserProfile(address as `0x${string}`)
          console.log(`Debug: Got profile for ${address}:`, {
            role: profile.role,
            roleHash: profile.role,
            name: profile.name,
            isVerified: profile.isVerified
          })
          
          // Check if user is a recycler using the role hash
          if (profile.role === await getRoleHash(africycle, 'RECYCLER_ROLE') && profile.name) {
            console.log(`Debug: Found recycler at ${address}:`, profile.name)
            recyclersList.push({
              address: address as `0x${string}`,
              name: profile.name,
              location: profile.location,
              contactInfo: profile.contactInfo,
              isVerified: profile.isVerified,
              reputationScore: profile.recyclerReputationScore,
              totalInventory: profile.totalInventory,
              activeListings: profile.activeListings
            })
          } else {
            console.log(`Debug: Address ${address} is not a recycler or not registered:`, {
              role: profile.role,
              expectedRole: await getRoleHash(africycle, 'RECYCLER_ROLE'),
              hasName: !!profile.name
            })
          }
        } catch (error) {
          console.log(`Debug: Error checking address ${address}:`, error)
        }
      }
      
      console.log('Debug: Finished fetching recyclers:', {
        totalFound: recyclersList.length,
        recyclers: recyclersList,
        roleHash: await getRoleHash(africycle, 'RECYCLER_ROLE'),
        checkedAddresses: KNOWN_RECYCLERS
      })
      
      setRecyclers(recyclersList)
    } catch (error) {
      console.error('Error fetching recyclers:', error)
      toast.error('Failed to fetch recyclers')
    } finally {
      console.log('Debug: Setting loading state to false')
      setLoadingRecyclers(false)
    }
  }, [africycle, isHookReady])

  // Add debug logs for hook readiness
  useEffect(() => {
    console.log('Debug: Hook readiness changed:', {
      isHookReady,
      hasAfricycle: !!africycle,
      hasWalletClient: !!walletClient,
      address
    })
    
    if (isHookReady) {
      console.log('Debug: Hook is ready, fetching recyclers')
      fetchRecyclers()
    }
  }, [isHookReady, fetchRecyclers, africycle, walletClient, address])

  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
            <p className="text-muted-foreground">
              Submit and manage your waste collections
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Collection</TabsTrigger>
              <TabsTrigger value="history">Collection History</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Submit New Collection</CardTitle>
                  <CardDescription>
                    Fill in the details of your waste collection. All fields are
                    required.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Waste Type</label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={state.form.wasteType}
                          onChange={(e) =>
                            handleFormChange('wasteType', Number(e.target.value))
                          }
                          required
                        >
                          <option value={AfricycleWasteStream.PLASTIC}>
                            Plastic
                          </option>
                          <option value={AfricycleWasteStream.EWASTE}>
                            E-Waste
                          </option>
                          <option value={AfricycleWasteStream.METAL}>
                            Metal
                          </option>
                          <option value={AfricycleWasteStream.GENERAL}>
                            General Waste
                          </option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={MAX_COLLECTION_WEIGHT}
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={state.form.weight}
                          onChange={(e) =>
                            handleFormChange('weight', e.target.value)
                          }
                          placeholder="Enter weight in kilograms"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum weight: {MAX_COLLECTION_WEIGHT} kg
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Location</label>
                        <input
                          type="text"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={state.form.location}
                          onChange={(e) =>
                            handleFormChange('location', e.target.value)
                          }
                          placeholder="Enter collection location"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Pickup Time</label>
                        <input
                          type="datetime-local"
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          value={new Date(state.form.pickupTime * 1000)
                            .toISOString()
                            .slice(0, 16)}
                          onChange={(e) => {
                            const timestamp = Math.floor(
                              new Date(e.target.value).getTime() / 1000
                            );
                            handleFormChange('pickupTime', timestamp);
                          }}
                          min={new Date().toISOString().slice(0, 16)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Select when you want the waste to be picked up
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Select Recycler
                      </label>
                      <select
                        className="w-full rounded-md border border-input bg-background px-3 py-2"
                        value={state.form.recycler}
                        onChange={(e) =>
                          handleFormChange(
                            'recycler',
                            e.target.value as `0x${string}`
                          )
                        }
                        required
                        disabled={loadingRecyclers}
                      >
                        <option value="0x0000000000000000000000000000000000000000">
                          {loadingRecyclers
                            ? 'Loading recyclers...'
                            : 'Select a recycler'}
                        </option>
                        {recyclers.map((recycler) => (
                          <option key={recycler.address} value={recycler.address}>
                            {recycler.name} - {recycler.location}
                            {recycler.isVerified && ' ✓'}
                            (Rep: {Number(recycler.reputationScore)})
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {loadingRecyclers
                          ? 'Loading available recyclers...'
                          : recyclers.length === 0
                          ? 'No recyclers available'
                          : 'Choose the recycler who will process your waste'}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-4 sm:p-8">
                      {state.form.selectedImage ? (
                        <div className="relative w-full max-w-md aspect-[4/3]">
                          <ImageWithFallback
                            src={state.form.selectedImage}
                            alt="Selected collection"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              handleFormChange('selectedImage', null);
                              handleFormChange('imageHash', null);
                            }}
                          >
                            <IconTrash className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <IconCamera className="h-12 w-12 text-muted-foreground" />
                          <div className="text-center">
                            <p className="text-sm font-medium">
                              Upload collection photos
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Take or upload photos of your collection for
                              verification
                            </p>
                          </div>
                        </>
                      )}

                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        id="photo-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          await handleImageUpload(file);
                        }}
                        required
                      />

                      <Button
                        onClick={() =>
                          document.getElementById('photo-upload')?.click()
                        }
                        disabled={state.form.uploading}
                        className="mt-4"
                      >
                        {state.form.uploading ? (
                          'Uploading...'
                        ) : (
                          <>
                            <IconUpload className="mr-2 h-4 w-4" />
                            {state.form.selectedImage
                              ? 'Change Photo'
                              : 'Upload Photos'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={submitButtonDisabled}
                  className="w-full sm:w-auto"
                >
                  {state.form.submitting ? (
                    <>
                      <IconUpload className="mr-2 h-4 w-4 animate-spin" />
                      {submitButtonText}
                    </>
                  ) : (
                    <>
                      <IconCheck className="mr-2 h-4 w-4" />
                      {submitButtonText}
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <CollectionSummary collections={state.collections} />

              <Card>
                <CardHeader>
                  <CardTitle>Collection History</CardTitle>
                  <CardDescription>
                    View and manage your collection history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CollectionFilters
                    filters={filters}
                    onFilterChange={setFilters}
                  />

                  <div className="min-h-[300px]">
                    {fetchError ? (
                      <div className="py-8 text-center text-destructive">
                        Error loading collections: {fetchError}
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => {
                            setFetchError(null);
                            hasFetchedRef.current = false;
                            fetchCollections();
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    ) : isInitialLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <CollectionSkeleton key={i} />
                        ))}
                      </div>
                    ) : filteredCollections.length > 0 ? (
                      <div className="space-y-4">
                        {filteredCollections.map((collection) => (
                          <CollectionItem
                            key={collection.collectionId}
                            collection={collection}
                            timeAgo={timeAgo}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        {filters.search ||
                        filters.status !== 'ALL' ||
                        filters.wasteType !== 'ALL'
                          ? 'No collections match your filters'
                          : 'No collections found. Submit your first collection above!'}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  );
}
