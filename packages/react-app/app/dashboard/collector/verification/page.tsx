"use client"

import { useEffect, useState, useCallback, useMemo, memo, useRef } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconUpload, IconPhoto, IconCheck, IconCamera, IconTrash, IconX } from "@tabler/icons-react"
import { useAfriCycle, AfricycleStatus, AfricycleWasteStream, AfricycleQualityGrade, WasteCollection } from "@/hooks/useAfricycle"
import { useAccount, useWalletClient } from "wagmi"
import { cloudinaryConfig, getCloudinaryConfig, CloudinaryUploadResult } from "@/lib/cloudinary"
import Image from "next/image"
import { 
  parseEther, 
  formatEther, 
  createPublicClient, 
  http, 
  PublicClient,
  type Hash,
  getContract,
  waitForTransaction
} from "viem"
import { celoAlfajores } from "viem/chains"
import axios from "axios"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

// Add this helper function before the component
const getCloudinaryImageUrl = (publicId: string) => {
  return `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${publicId}`
}

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"

// Add debug logging for contract configuration
console.log('Verification Page Contract Config:', {
  contractAddress: CONTRACT_ADDRESS,
  rpcUrl: RPC_URL,
  envContractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS
})

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
    quality: AfricycleQualityGrade;
    location: string;
  };
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
))
CollectionSkeleton.displayName = 'CollectionSkeleton'

// Update the CollectionItem component to use navigation
const CollectionItem = memo(({ 
  collection, 
  timeAgo,
  isLoading = false
}: { 
  collection: Collection, 
  timeAgo: (timestamp: bigint) => string,
  isLoading?: boolean
}) => {
  const router = useRouter()
  const imageUrl = useMemo(() => 
    collection.imageHash ? getCloudinaryImageUrl(collection.imageHash) : "/placeholder.svg"
  , [collection.imageHash])
  
  if (isLoading) {
    return <CollectionSkeleton />
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
                e.currentTarget.src = "/placeholder.svg"
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <IconPhoto className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">Collection #{collection.collectionId}</p>
          <p className="text-sm text-muted-foreground">
            Created {timeAgo(collection.timestamp)}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {AfricycleWasteStream[collection.wasteType]} • {collection.weight.toString()} kg
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
          onClick={() => router.push(`/dashboard/collector/verification/${collection.collectionId}`)}
          className="w-full sm:w-auto"
        >
          View Details
        </Button>
      </div>
    </div>
  )
})
CollectionItem.displayName = 'CollectionItem'

// Add this constant at the top of the file after imports
const MAX_COLLECTION_WEIGHT = 1000; // Maximum weight in kg

// Add this function before the PhotoVerificationPage component
const uploadToCloudinary = async (file: File): Promise<CloudinaryUploadResult> => {
  // Get fresh config values
  const config = getCloudinaryConfig()

  if (!config.cloudName) {
    throw new Error('Invalid Cloudinary cloud name. Please check your environment variables.')
  }

  if (!config.uploadPreset) {
    throw new Error('Cloudinary upload preset is not configured. Please set NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in your environment variables.')
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', config.uploadPreset)
  
  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`
  
  try {
    const response = await axios.post(
      uploadUrl,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
        validateStatus: (status) => status === 200
      }
    )
    return response.data
  } catch (error: any) {
    throw new Error(`Failed to upload image: ${error.response?.data?.error?.message || error.message}`)
  }
}

// Define the raw collection data type from smart contract
type RawCollectionData = [
  bigint,    // id
  string,    // collector
  number,    // status
  bigint,    // weight
  string,    // location
  string,    // imageHash
  number,    // wasteType
  bigint,    // timestamp
  number,    // quality
  bigint,    // earnings
  boolean    // isVerified
]

// Update the type guard for collection data
const isValidCollectionData = (data: unknown): data is RawCollectionData => {
  // Check if data is an array with at least 7 elements (minimum required fields)
  if (!Array.isArray(data) || data.length < 7) {
    console.log('Debug: Data is not an array or too short:', data)
    return false
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
    isVerified
  ] = data as RawCollectionData

  // Basic type checks for required fields
  return (
    typeof collector === 'string' &&
    typeof status === 'number' &&
    typeof wasteType === 'number' &&
    typeof timestamp === 'bigint' &&
    typeof weight === 'bigint' &&
    typeof location === 'string' &&
    typeof imageHash === 'string'
  )
}

// Update helper function to convert array data to Collection object
const arrayToCollection = (data: unknown, id: number): Collection | null => {
  if (!isValidCollectionData(data)) {
    console.error(`Debug: Invalid collection data format for #${id}:`, data)
    return null
  }

  // Skip empty collections (where collector is zero address)
  if (data[1] === '0x0000000000000000000000000000000000000000') {
    console.log(`Debug: Skipping empty collection #${id}`)
    return null
  }

  // Destructure the data array according to the contract's WasteCollection struct
  const [
    _id,           // uint256 id
    collector,     // address collector
    wasteType,     // WasteStream wasteType
    weight,        // uint256 weight
    location,      // string location
    imageHash,     // string imageHash
    status,        // Status status
    timestamp,     // uint256 timestamp
    quality,       // QualityGrade quality
    rewardAmount,  // uint256 rewardAmount
    isProcessed    // bool isProcessed
  ] = data as any[]

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
    imageUrl: imageHash ? 
      `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${imageHash}` : 
      ''
  }
}

export default function PhotoVerificationPage() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const router = useRouter()

  const [state, setState] = useState<AppState>({
    loading: true,
    collections: [],
    form: {
      uploading: false,
      submitting: false,
      selectedImage: null,
      imageHash: null,
      weight: "",
      wasteType: AfricycleWasteStream.PLASTIC,
      quality: AfricycleQualityGrade.MEDIUM,
      location: ""
    }
  })

  // Add state for contract balance
  const [contractBalance, setContractBalance] = useState<bigint | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [balanceError, setBalanceError] = useState<string | null>(null)

  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL
  })

  // Fetch contract balance
  useEffect(() => {
    async function fetchContractBalance() {
      if (!africycle) return;
      
      try {
        setBalanceLoading(true);
        setBalanceError(null);
        const balance = await africycle.getContractCUSDBalance();
        setContractBalance(balance);
      } catch (error) {
        console.error("Error fetching contract balance:", error);
        setBalanceError("Failed to fetch contract balance");
      } finally {
        setBalanceLoading(false);
      }
    }

    fetchContractBalance();
    // Refresh balance every minute
    const interval = setInterval(fetchContractBalance, 60000);
    return () => clearInterval(interval);
  }, [africycle]);

  // Create public client - memoize to prevent recreation
  const publicClient = useMemo(() => createPublicClient({
    chain: celoAlfajores,
    transport: http(RPC_URL)
  }) as PublicClient, [])

  const [loadingCollections, setLoadingCollections] = useState<Set<number>>(new Set())
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Move handleFormChange before it's used
  const handleFormChange = useCallback((field: keyof typeof state.form, value: any) => {
    setState(prev => ({ 
      ...prev, 
      form: { ...prev.form, [field]: value } 
    }))
  }, [])

  // Update handleImageUpload to use handleFormChange
  const handleImageUpload = useCallback(async (file: File) => {
    try {
      setState(prev => ({ 
        ...prev, 
        form: { ...prev.form, uploading: true } 
      }))
      
      const result = await uploadToCloudinary(file)
      handleFormChange('selectedImage', result.secure_url)
      // Store the public_id for later use
      handleFormChange('imageHash', result.public_id)
      
      toast.success("Image uploaded successfully")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("Failed to upload image")
    } finally {
      setState(prev => ({ 
        ...prev, 
        form: { ...prev.form, uploading: false } 
      }))
    }
  }, [handleFormChange])

  // Update fetchCollections to handle WasteCollection type properly
  const fetchCollections = useCallback(async () => {
    if (!address || !africycle) {
      console.log('Debug: fetchCollections - Missing address or africycle:', { 
        hasAddress: !!address, 
        hasAfricycle: !!africycle
      })
      setIsInitialLoading(false) // Make sure to set loading to false even if we can't fetch
      return
    }
    
    try {
      console.log('Debug: Starting to fetch collections for address:', address)
      setIsInitialLoading(true)
      
      // Get collector stats first
      console.log('Debug: Fetching collector stats...')
      const collectorStats = await africycle.getCollectorStats(address)
      console.log('Debug: Collector stats:', collectorStats)
      
      const totalCollections = Number(collectorStats.totalCollected)
      console.log('Debug: Total collections to fetch:', totalCollections)
      
      if (totalCollections > 0) {
        console.log(`Debug: Found ${totalCollections} collections for collector`)
        
        // Fetch all collections in parallel with a reasonable batch size
        const BATCH_SIZE = 10
        const batches = Math.ceil(totalCollections / BATCH_SIZE)
        const allCollections: Collection[] = []
        
        console.log(`Debug: Processing ${batches} batches of size ${BATCH_SIZE}`)
        
        for (let batch = 0; batch < batches; batch++) {
          const start = batch * BATCH_SIZE
          const end = Math.min(start + BATCH_SIZE, totalCollections)
          
          console.log(`Debug: Processing batch ${batch + 1}/${batches} (indices ${start}-${end-1})`)
          
          try {
            // Create batch of promises
            const batchPromises = Array.from(
              { length: end - start }, 
              (_, i) => africycle.getCollection(BigInt(start + i))
            )
            
            // Fetch batch in parallel
            const batchResults = await Promise.all(batchPromises)
            console.log(`Debug: Batch ${batch + 1} results:`, batchResults)
            
            // Process batch results
            const validCollections = batchResults
              .map((data, i) => {
                const collection = arrayToCollection(data, start + i)
                if (collection) {
                  console.log(`Debug: Valid collection found at index ${start + i}:`, collection)
                }
                return collection
              })
              .filter((c): c is Collection => c !== null && c.collector.toLowerCase() === address.toLowerCase())
            
            console.log(`Debug: Batch ${batch + 1} valid collections:`, validCollections.length)
            allCollections.push(...validCollections)
            
            // Update state with current batch results
            setState(prev => ({
              ...prev,
              collections: [...allCollections]
            }))
          } catch (error) {
            console.error(`Debug: Error processing batch ${batch + 1}:`, error)
            // Continue with next batch even if this one fails
          }
        }
        
        console.log('Debug: Final collections array:', allCollections)
      } else {
        console.log('Debug: No collections found for collector')
        setState(prev => ({
          ...prev,
          collections: []
        }))
      }
    } catch (error) {
      console.error('Debug: Error in fetchCollections:', error)
      toast.error("Failed to fetch collections")
    } finally {
      console.log('Debug: Setting initial loading to false')
      setIsInitialLoading(false)
    }
  }, [address, africycle])

  // Memoize utility functions
  const formatDate = useCallback((timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }, [])

  const timeAgo = useCallback((timestamp: bigint) => {
    const seconds = Math.floor(Date.now() / 1000) - Number(timestamp)
    
    if (seconds < 60) return `${seconds} seconds ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }, [])

  // Add a memoized version of the collections list to prevent unnecessary re-renders
  const collectionsList = useMemo(() => {
    return state.collections.map((collection) => (
      <CollectionItem
        key={collection.collectionId}
        collection={collection}
        timeAgo={timeAgo}
        isLoading={loadingCollections.has(collection.collectionId)}
      />
    ))
  }, [state.collections, loadingCollections, timeAgo])

  // Update handleSubmit to use waitForTransaction
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !africycle || !state.form.imageHash) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        form: { ...prev.form, submitting: true } 
      }));

      const weight = parseFloat(state.form.weight);
      if (isNaN(weight) || weight <= 0) {
        throw new Error("Please enter a valid weight greater than 0");
      }

      if (weight > MAX_COLLECTION_WEIGHT) {
        throw new Error(`Weight exceeds maximum allowed limit of ${MAX_COLLECTION_WEIGHT} kg`);
      }

      if (!state.form.location.trim()) {
        throw new Error("Please enter a valid location");
      }

      // Create the collection
      const hash = await africycle.createCollection(
        address,
        state.form.wasteType,
        weight,
        state.form.location,
        "", // QR code is optional
        state.form.imageHash
      );

      // Wait for transaction to be mined using the public client
      const publicClient = createPublicClient({
        chain: celoAlfajores,
        transport: http(RPC_URL)
      });
      await waitForTransaction(publicClient, { hash });

      toast.success("Collection created successfully!");
      
      // Reset form
      setState(prev => ({
        ...prev,
        form: {
          uploading: false,
          submitting: false,
          selectedImage: null,
          imageHash: null,
          weight: "",
          wasteType: AfricycleWasteStream.PLASTIC,
          quality: AfricycleQualityGrade.MEDIUM,
          location: ""
        }
      }));

      // Refresh collections
      fetchCollections();
      
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create collection");
    } finally {
      setState(prev => ({ 
        ...prev, 
        form: { ...prev.form, submitting: false } 
      }));
    }
  }, [address, africycle, state.form, fetchCollections, RPC_URL]);

  // Use a ref to track if we've already fetched collections
  const hasFetchedRef = useRef(false)

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      if (!hasFetchedRef.current) {
        console.log('Debug: Starting initial fetch')
        hasFetchedRef.current = true
        await fetchCollections()
      }
    }
    fetchData()
  }, [fetchCollections])

  // Add error state
  const [fetchError, setFetchError] = useState<string | null>(null)

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Collections"
        text="Submit and manage your waste collections"
      />

      <div className="grid gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Submit New Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Waste Type</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={state.form.wasteType}
                    onChange={(e) => handleFormChange('wasteType', Number(e.target.value))}
                  >
                    <option value={AfricycleWasteStream.PLASTIC}>Plastic</option>
                    <option value={AfricycleWasteStream.EWASTE}>E-Waste</option>
                    <option value={AfricycleWasteStream.METAL}>Metal</option>
                    <option value={AfricycleWasteStream.GENERAL}>General Waste</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quality Grade</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={state.form.quality}
                    onChange={(e) => handleFormChange('quality', Number(e.target.value))}
                  >
                    <option value={AfricycleQualityGrade.LOW}>Low</option>
                    <option value={AfricycleQualityGrade.MEDIUM}>Medium</option>
                    <option value={AfricycleQualityGrade.HIGH}>High</option>
                    <option value={AfricycleQualityGrade.PREMIUM}>Premium</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={state.form.weight}
                    onChange={(e) => handleFormChange('weight', e.target.value)}
                    placeholder="Enter weight in kilograms"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={state.form.location}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    placeholder="Enter collection location"
                  />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-4 sm:p-8">
                {state.form.selectedImage ? (
                  <div className="relative w-full max-w-md aspect-[4/3]">
                    <Image
                      src={state.form.selectedImage}
                      alt="Selected collection"
                      fill
                      className="rounded-lg object-cover"
                      sizes="(max-width: 400px) 100vw, 400px"
                      onError={(e) => {
                        toast.error('Failed to load image preview')
                        handleFormChange('selectedImage', null)
                      }}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        handleFormChange('selectedImage', null)
                        handleFormChange('imageHash', null)
                      }}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <IconCamera className="h-12 w-12 text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-medium">Upload collection photos</p>
                      <p className="text-xs text-muted-foreground">
                        Take or upload photos of your collection for verification
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
                    const file = e.target.files?.[0]
                    if (!file) return
                    await handleImageUpload(file)
                  }}
                />
                
                <Button 
                  onClick={() => document.getElementById('photo-upload')?.click()} 
                  disabled={state.form.uploading}
                  className="mt-4"
                >
                  {state.form.uploading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <IconUpload className="mr-2 h-4 w-4" />
                      {state.form.selectedImage ? "Change Photo" : "Upload Photos"}
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
            disabled={state.form.submitting || !state.form.imageHash || !state.form.weight || !state.form.location}
            className="w-full sm:w-auto"
          >
            {state.form.submitting ? (
              <>
                <IconUpload className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <IconCheck className="mr-2 h-4 w-4" />
                Submit Collection
              </>
            )}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Your Collections</span>
              <span className="text-sm font-normal text-muted-foreground">
                {fetchError ? "Error loading collections" : (isInitialLoading ? "Loading..." : `${state.collections.length} items`)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px]">
              {fetchError ? (
                <div className="py-8 text-center text-destructive">
                  Error loading collections: {fetchError}
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setFetchError(null)
                      hasFetchedRef.current = false
                      fetchCollections()
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
              ) : state.collections.length > 0 ? (
                <div className="space-y-4">
                  {collectionsList}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No collections found. Submit your first collection above!
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Contract Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Status</CardTitle>
            <CardDescription>
              Current cUSD balance available for rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span>Loading balance...</span>
              </div>
            ) : balanceError ? (
              <div className="text-destructive">
                {balanceError}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2"
                  onClick={() => {
                    setBalanceError(null);
                    setBalanceLoading(true);
                    africycle?.getContractCUSDBalance()
                      .then(setContractBalance)
                      .catch(error => {
                        console.error("Error fetching balance:", error);
                        setBalanceError("Failed to fetch balance");
                      })
                      .finally(() => setBalanceLoading(false));
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold">
                  {formatEther(contractBalance || BigInt(0))}
                </span>
                <span className="text-muted-foreground">cUSD</span>
                {contractBalance === BigInt(0) && (
                  <Badge variant="destructive" className="ml-2">
                    No rewards available
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}