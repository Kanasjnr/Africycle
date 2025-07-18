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
import { EmailService } from '@/lib/email-service';
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
                `/dashboard/collector/verification/id?id=${collection.collectionId}`
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

// Update helper function to convert array data to Collection object
const arrayToCollection = (data: WasteCollection, id: number): Collection | null => {
  console.log(`Debug: Processing collection ${id} with data:`, data);
  
  // Check if the data is valid
  if (!data || !data.collector) {
    console.error(`Debug: Invalid collection data format for #${id}:`, data);
    return null;
  }

  // Skip empty collections (where collector is zero address)
  if (data.collector === '0x0000000000000000000000000000000000000000') {
    console.log(`Debug: Skipping empty collection #${id}`);
    return null;
  }

  console.log(`Debug: Processing valid collection ${id}:`, {
    id: data.id,
    collector: data.collector,
    wasteType: data.wasteType,
    weight: data.weight,
    location: data.location,
    imageHash: data.imageHash,
    status: data.status,
    timestamp: data.timestamp,
    quality: data.quality,
    rewardAmount: data.rewardAmount,
    isProcessed: data.isProcessed,
    pickupTime: data.pickupTime,
    selectedRecycler: data.selectedRecycler
  });

  const processedCollection: Collection = {
    collectionId: id,
    collector: data.collector,
    wasteType: data.wasteType,
    weight: data.weight,
    location: data.location,
    imageHash: data.imageHash,
    status: data.status,
    timestamp: data.timestamp,
    quality: data.quality,
    rewardAmount: data.rewardAmount,
    isProcessed: data.isProcessed,
    imageUrl: data.imageHash
      ? `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${data.imageHash}`
      : '',
  };

  console.log(`Debug: Final processed collection ${id}:`, processedCollection);
  return processedCollection;
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
  "0x817c19bD1Ba4eD47e180a3219d12d1462C8fABDC",
   "0xF1240B5C1C468aA68Bd77DCFAf10d6d46E9CB8Ea"
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

  // Add activeTab state here before it's used in useEffect
  const [activeTab, setActiveTab] = useState('new');
  const [filters, setFilters] = useState<CollectionFilters>({
    status: 'ALL',
    wasteType: 'ALL',
    search: '',
    sortField: 'timestamp',
    sortOrder: 'desc',
  });

  // Move handleFormChange before it's used
  const handleFormChange = useCallback(
    (field: keyof typeof state.form, value: any) => {
      setState((prev) => ({
        ...prev,
        form: { ...prev.form, [field]: value },
      }));
    },
    [state]
  );

  // Update fetchCollections to use the hook properly - MOVED HERE BEFORE useEffect
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

      // Search through collection IDs systematically
      console.log('Debug: Starting collection search...');
      
      let currentId = 0;
      const MAX_ATTEMPTS = 100; 
      let consecutiveEmptyCount = 0;
      const MAX_CONSECUTIVE_EMPTY = 20; 
      
      while (currentId < MAX_ATTEMPTS && consecutiveEmptyCount < MAX_CONSECUTIVE_EMPTY) {
        try {
          console.log(`Debug: Fetching collection ID ${currentId}...`);
          const collectionDetails = await africycle.getCollectionDetails(BigInt(currentId));
          console.log(`Debug: Raw response for ID ${currentId}:`, collectionDetails);
          
          // Check if collection exists by looking at the collection property
          console.log(`Debug: Full collectionDetails structure:`, {
            collectionDetails,
            hasCollection: !!collectionDetails?.collection,
            collectionData: collectionDetails?.collection,
            isObject: typeof collectionDetails === 'object',
            keys: Object.keys(collectionDetails || {}),
            isArray: Array.isArray(collectionDetails),
            arrayLength: Array.isArray(collectionDetails) ? collectionDetails.length : 0,
            firstElement: Array.isArray(collectionDetails) ? (collectionDetails as any)[0] : null
          });
          
          // Handle both object structure and array structure
          let collectionData = null;
          if (collectionDetails?.collection) {
            // Expected object structure
            collectionData = collectionDetails.collection;
          } else if (Array.isArray(collectionDetails) && (collectionDetails as any)[0]) {
            // Actual array structure from contract - cast to any to handle unknown structure
            collectionData = (collectionDetails as any)[0];
          }
          
          if (collectionData && 
              collectionData.collector && 
              collectionData.collector !== '0x0000000000000000000000000000000000000000') {
            
            console.log(`Debug: Found valid collection at ID ${currentId}:`, collectionData);
            
            // Reset consecutive empty count since we found a collection
            consecutiveEmptyCount = 0;
            
            // Check if this collection belongs to the current user
            if (collectionData.collector.toLowerCase() === address.toLowerCase()) {
              console.log(`Debug: Collection ${currentId} belongs to current user`);
              
              const collection = arrayToCollection(collectionData as WasteCollection, currentId);
              if (collection) {
                collections.push(collection);
                console.log(`Debug: Added collection ${currentId} to array. Total: ${collections.length}`);
              }
            } else {
              console.log(`Debug: Collection ${currentId} belongs to different user: ${collectionData.collector}`);
            }
          } else {
            console.log(`Debug: Empty collection slot at ID ${currentId}`);
            consecutiveEmptyCount++;
          }
          
          currentId++;
        } catch (error) {
          console.log(`Debug: Error fetching collection ${currentId}:`, error);
          consecutiveEmptyCount++;
          currentId++;
        }
      }

      console.log(`Debug: Collection search complete. Found ${collections.length} collections for user`);
      setState((prev) => ({ ...prev, collections }));
      
    } catch (error) {
      console.error('Debug: Error in fetchCollections:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch collections');
      toast.error('Failed to fetch collections');
    } finally {
      setIsInitialLoading(false);
    }
  }, [address, africycle, isHookReady]);

  // Auto-fetch collections when hook is ready and history tab is active
  useEffect(() => {
    if (isHookReady && activeTab === 'history') {
      fetchCollections();
    }
  }, [isHookReady, activeTab, fetchCollections]);

  // Add error state
  const [fetchError, setFetchError] = useState<string | null>(null);

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
    return filteredCollections.map((collection) => (
      <CollectionItem
        key={collection.collectionId}
        collection={collection}
        timeAgo={timeAgo}
        isLoading={loadingCollections.has(collection.collectionId)}
      />
    ));
  }, [filteredCollections, loadingCollections, timeAgo]);

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

  // Update handleSubmit to check recycler role before submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!address || !africycle || !isHookReady || !state.form.imageHash) {
        toast.error('Please connect your wallet and complete all required fields');
        return;
      }

      try {
        // Check if the selected recycler has the recycler role
        console.log('Debug: Checking recycler role before submission:', {
          recycler: state.form.recycler
        });

        const recyclerRoleHash = await getRoleHash(africycle, 'RECYCLER_ROLE');
        console.log('Debug: Recycler role hash:', recyclerRoleHash);

        const hasRecyclerRole = await africycle.hasRole(recyclerRoleHash, state.form.recycler);

        console.log('Debug: Recycler role check result:', {
          recycler: state.form.recycler,
          hasRecyclerRole: hasRecyclerRole
        });

        if (!hasRecyclerRole) {
          throw new Error(`Selected recycler does not have the recycler role`);
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

        // Send collection request email to recycler (don't wait for it to complete)
        const selectedRecycler = recyclers.find(r => r.address === state.form.recycler);
        if (selectedRecycler) {
          const recyclerEmail = EmailService.extractEmailFromContactInfo(selectedRecycler.contactInfo);
          if (recyclerEmail) {
            // Get the collection ID from the transaction logs (approximate since we just created it)
            const collectionId = Date.now().toString(); // Use timestamp as approximation
            
            EmailService.sendCollectionRequest({
              recyclerEmail,
              collectionId,
              wasteType: EmailService.getWasteTypeNumber(state.form.wasteType),
              weight: parseFloat(state.form.weight),
              location: state.form.location,
              pickupTime: state.form.pickupTime,
              collectorName: 'Collector', // Will be replaced with actual name from profile
              collectorAddress: address,
              collectorContact: 'Contact info not available',
              imageHash: state.form.imageHash || undefined,
            }).then((result) => {
              if (result.success) {
                console.log('Collection request email sent successfully');
              } else {
                console.log('Collection request email failed to send:', result.error);
              }
            }).catch((error) => {
              console.log('Collection request email error:', error);
            });
          } else {
            console.log('No valid email found for recycler:', selectedRecycler.contactInfo);
          }
        }

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

  // Add state for recyclers
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  const [loadingRecyclers, setLoadingRecyclers] = useState(true);

  // Professional approach to fetch all recyclers from the blockchain
  const fetchRecyclers = useCallback(async () => {
    if (!africycle || !isHookReady) {
      console.log('Debug: fetchRecyclers - Missing requirements:', {
        hasAfricycle: !!africycle,
        isHookReady,
      })
      return
    }

    try {
      console.log('Debug: Starting professional recycler discovery...')
      setLoadingRecyclers(true)
      const recyclersList: Recycler[] = []
      
      // Use the known recycler role hash for efficiency
      const RECYCLER_ROLE_HASH = '0x11d2c681bc9c10ed61f9a422c0dbaaddc4054ce58ec726aca73e7e4d31bcd154'
      console.log(`Debug: Using recycler role hash: ${RECYCLER_ROLE_HASH}`)
      
      // Professional approach: Search for RoleGranted events with the specific recycler role
      let recyclerAddresses: `0x${string}`[] = []
      
      try {
        console.log('Debug: Fetching RoleGranted events for RECYCLER_ROLE...')
        
        // Get current block to determine search range
        const currentBlock = await publicClient.getBlockNumber()
        console.log(`Debug: Current block: ${currentBlock}`)
        
        // Search in chunks to avoid RPC limits - start from a reasonable deployment block
        const DEPLOYMENT_BLOCK = BigInt(38000000) // Approximate Celo deployment block
        const CHUNK_SIZE = BigInt(50000) // Reasonable chunk size for Celo
        
        let fromBlock = DEPLOYMENT_BLOCK
        const allRoleGrantedEvents: any[] = []
        
        while (fromBlock <= currentBlock) {
          const toBlock = fromBlock + CHUNK_SIZE > currentBlock ? currentBlock : fromBlock + CHUNK_SIZE
          
          console.log(`Debug: Searching blocks ${fromBlock} to ${toBlock}...`)
          
          try {
                         const roleGrantedEvents = await publicClient.getLogs({
               address: CONTRACT_ADDRESS,
               event: {
                 type: 'event',
                 name: 'RoleGranted',
                 inputs: [
                   { name: 'role', type: 'bytes32', indexed: true },
                   { name: 'account', type: 'address', indexed: true },
                   { name: 'sender', type: 'address', indexed: true }
                 ]
               },
               args: {
                 role: RECYCLER_ROLE_HASH as `0x${string}`
               },
               fromBlock: fromBlock,
               toBlock: toBlock
             })
            
            allRoleGrantedEvents.push(...roleGrantedEvents)
            console.log(`Debug: Found ${roleGrantedEvents.length} RECYCLER_ROLE grants in blocks ${fromBlock}-${toBlock}`)
            
          } catch (chunkError) {
            console.log(`Debug: Error fetching events for blocks ${fromBlock}-${toBlock}:`, chunkError)
            // Continue with next chunk
          }
          
          fromBlock = toBlock + BigInt(1)
        }
        
        console.log(`Debug: Total RoleGranted events found: ${allRoleGrantedEvents.length}`)
        
        // Extract unique recycler addresses from events
        recyclerAddresses = Array.from(
          new Set(
            allRoleGrantedEvents
              .map(event => event.args?.account)
              .filter(Boolean)
          )
        ) as `0x${string}`[]
        
        console.log(`Debug: Found ${recyclerAddresses.length} unique recycler addresses from RoleGranted events:`, recyclerAddresses)
        
      } catch (eventError) {
        console.log('Debug: Error fetching RoleGranted events:', eventError)
        console.log('Debug: Falling back to known recyclers and direct role checking')
        recyclerAddresses = []
      }
      
      // Add known recyclers to the search list (in case events missed some)
      const allAddressesToCheck = Array.from(
        new Set([...recyclerAddresses, ...KNOWN_RECYCLERS])
      ) as `0x${string}`[]
      
      console.log(`Debug: Total addresses to verify: ${allAddressesToCheck.length}`)
      
      // Verify each address and get their profiles
      for (const address of allAddressesToCheck) {
        try {
          console.log(`Debug: Verifying recycler ${address}...`)
          
          // Double-check they have the recycler role (in case of role revocations)
          const hasRole = await africycle.hasRole(RECYCLER_ROLE_HASH, address)
          
          if (hasRole) {
            console.log(`Debug: Confirmed ${address} has recycler role, fetching profile...`)
            
            // Get their profile
            const profile = await africycle.getUserProfile(address)
            
            if (profile.name && profile.name.trim()) {
              console.log(`Debug: Found valid recycler ${address}: ${profile.name}`)
              recyclersList.push({
                address: address,
                name: profile.name,
                location: profile.location || 'Location not set',
                contactInfo: profile.contactInfo || 'Contact info not set',
                isVerified: profile.isVerified,
                reputationScore: profile.recyclerReputationScore,
                totalInventory: profile.totalInventory,
                activeListings: profile.activeListings
              })
            } else {
              console.log(`Debug: ${address} has recycler role but incomplete profile`)
            }
          } else {
            console.log(`Debug: ${address} no longer has recycler role`)
          }
        } catch (error) {
          console.log(`Debug: Error verifying recycler ${address}:`, error)
          // Continue with next address
        }
      }
      
      // Sort recyclers by reputation score (descending) and then by name
      recyclersList.sort((a, b) => {
        const reputationDiff = Number(b.reputationScore) - Number(a.reputationScore)
        if (reputationDiff !== 0) return reputationDiff
        return a.name.localeCompare(b.name)
      })
      
      console.log('Debug: Professional recycler discovery complete:', {
        totalFound: recyclersList.length,
        recyclers: recyclersList.map(r => ({ 
          address: r.address, 
          name: r.name, 
          reputation: Number(r.reputationScore),
          verified: r.isVerified
        }))
      })
      
      setRecyclers(recyclersList)
      
    } catch (error) {
      console.error('Error in professional recycler discovery:', error)
      toast.error('Failed to discover recyclers')
    } finally {
      setLoadingRecyclers(false)
    }
  }, [africycle, isHookReady, publicClient])

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

  // Add state for user registration status
  const [userStatus, setUserStatus] = useState<{
    isCollector: boolean;
    isRegistered: boolean;
    profile: any | null;
    loading: boolean;
  }>({
    isCollector: false,
    isRegistered: false,
    profile: null,
    loading: true,
  });

  const checkUserStatus = useCallback(async () => {
    if (!address || !africycle || !isHookReady) {
      setUserStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      console.log('Debug: Checking user status for address:', address);
      const profile = await africycle.getUserProfile(address);
      console.log('Debug: User profile:', profile);

      setUserStatus({
        isCollector: true, // Simplified - if they have a profile, assume they're a collector
        isRegistered: !!profile.name,
        profile,
        loading: false,
      }); 
    } catch (error) {
      console.error('Debug: Error checking user status:', error);
      setUserStatus(prev => ({ ...prev, loading: false }));
    }
  }, [address, africycle, isHookReady]);

  // Check user status when hook is ready
  useEffect(() => {
    checkUserStatus();
  }, [checkUserStatus]);

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
            onValueChange={(value) => {
              setActiveTab(value);
              // Always fetch collections when history tab is clicked
              if (value === 'history') {
                fetchCollections();
              }
            }}
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
                        Select Recycler {recyclers.length > 0 && `(${recyclers.length} available)`}
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
                            ? 'Discovering recyclers from blockchain...'
                            : recyclers.length === 0
                            ? 'No recyclers found'
                            : 'Select a recycler'}
                        </option>
                        {recyclers.map((recycler) => (
                          <option key={recycler.address} value={recycler.address}>
                            {recycler.isVerified ? '✓ ' : '• '}{recycler.name} 
                            {' '}({recycler.location})
                            {' '}[Rep: {Number(recycler.reputationScore)}/1000]
                            {Number(recycler.activeListings) > 0 && ` • ${Number(recycler.activeListings)} active listings`}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">
                        {loadingRecyclers
                          ? 'Searching blockchain for all registered recyclers...'
                          : recyclers.length === 0
                          ? 'No recyclers are currently registered on the platform'
                          : `Found ${recyclers.length} verified recycler${recyclers.length === 1 ? '' : 's'}. Choose based on location and reputation.`}
                      </p>
                      {recyclers.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <p>Legend: ✓ = Verified, • = Unverified, Rep = Reputation Score (0-1000)</p>
                        </div>
                      )}
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
                      </div>
                    ) : isInitialLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                          <CollectionSkeleton key={i} />
                        ))}
                      </div>
                    ) : collectionsList.length > 0 ? (
                      <div className="space-y-4">
                        {collectionsList}
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
                  {!userStatus.loading && !userStatus.isRegistered && (
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                      <p className="font-medium">Not Registered</p>
                      <p>You need to register as a collector before you can create collections.</p>
                    </div>
                  )}
                  {!userStatus.loading && userStatus.isRegistered && !userStatus.isCollector && (
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                      <p className="font-medium">Missing Collector Role</p>
                      <p>You are registered but don&apos;t have the collector role.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  );
}
