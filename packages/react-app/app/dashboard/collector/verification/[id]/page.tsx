"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconArrowLeft, IconX } from "@tabler/icons-react"
import { useAfriCycle, AfricycleStatus, AfricycleWasteStream, AfricycleQualityGrade, WasteCollection } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"
import Image from "next/image"
import { toast } from "sonner"
import { cloudinaryConfig } from "@/lib/cloudinary"
import { Badge } from "@/components/ui/badge"

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

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"

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

// Helper function to convert array data to Collection object
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

function CollectionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { address } = useAccount()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL
  })

  useEffect(() => {
    const fetchCollection = async () => {
      if (!address || !africycle || !params.id) {
        setError("Missing required data")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const collectionId = parseInt(params.id as string)
        
        if (isNaN(collectionId)) {
          throw new Error("Invalid collection ID")
        }

        console.log('Debug: Fetching collection #', collectionId)
        const wasteCollectionDetails = await africycle.getCollectionDetails(BigInt(collectionId))
        console.log('Debug: Raw collection data:', wasteCollectionDetails)
        
        const collection = arrayToCollection(wasteCollectionDetails.collection, collectionId)
        
        if (!collection) {
          throw new Error("Collection not found or invalid format")
        }

        // Verify this collection belongs to the current user
        if (collection.collector.toLowerCase() !== address.toLowerCase()) {
          throw new Error("You don't have permission to view this collection")
        }

        console.log('Debug: Processed collection:', collection)
        setCollection(collection)
      } catch (error) {
        console.error("Error fetching collection:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch collection details")
      } finally {
        setLoading(false)
      }
    }

    fetchCollection()
  }, [address, africycle, params.id])

  if (loading) {
    return (
      <DashboardShell>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <DashboardHeader
            heading="Collection Details"
            text="Loading collection information..."
          />
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-48 bg-muted rounded-lg" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <DashboardHeader
            heading="Collection Details"
            text="Error loading collection"
          />
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-destructive">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/collector/verification")}
                  className="gap-2"
                >
                  <IconArrowLeft className="h-4 w-4" />
                  Back to Collections
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  if (!collection) {
    return null
  }

  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          heading="Collection Details"
          text="View detailed information about your collection"
        />

        <div className="grid gap-4 sm:gap-6">
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard/collector/verification")}
              className="flex items-center gap-2"
            >
              <IconArrowLeft className="h-4 w-4" />
              Back to Collections
            </Button>

            <div className="flex items-center gap-2">
              <Badge
                variant={collection?.status === AfricycleStatus.VERIFIED ? "default" : "secondary"}
              >
                {collection?.status === AfricycleStatus.VERIFIED ? "Verified" : "Pending"}
              </Badge>
            </div>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6">
                <div className="relative aspect-[4/3] w-full max-w-2xl mx-auto rounded-lg overflow-hidden">
                  {collection.imageHash ? (
                    <Image
                      src={collection.imageUrl}
                      alt="Collection"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 768px"
                      priority
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <IconX className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Collection ID</p>
                    <p className="font-medium">#{collection.collectionId}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <p className="font-medium">{AfricycleStatus[collection.status]}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Weight</p>
                    <p className="font-medium">{collection.weight.toString()} kg</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Waste Type</p>
                    <p className="font-medium">{AfricycleWasteStream[collection.wasteType]}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Quality Grade</p>
                    <p className="font-medium">{AfricycleQualityGrade[collection.quality]}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p className="font-medium">{collection.location}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Reward Amount</p>
                    <p className="font-medium">{Number(collection.rewardAmount) / 1e18} cUSD</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium text-muted-foreground">Processing Status</p>
                    <p className="font-medium">{collection.isProcessed ? "Processed" : "Not Processed"}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 sm:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Collection Date</p>
                    <p className="font-medium">
                      {new Date(Number(collection.timestamp) * 1000).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}

export default CollectionDetailsPage 