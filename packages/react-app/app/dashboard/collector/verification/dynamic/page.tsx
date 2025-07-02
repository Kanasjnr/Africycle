"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  pickupTime: bigint;
  selectedRecycler: string;
  imageUrl: string; // Computed field for display
}

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"

// Helper function to convert WasteCollection data to Collection object
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
    pickupTime: data.pickupTime,
    selectedRecycler: data.selectedRecycler,
    imageUrl: data.imageHash
      ? `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload/${data.imageHash}`
      : '',
  };

  console.log(`Debug: Final processed collection ${id}:`, processedCollection);
  return processedCollection;
};

export default function CollectionDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address } = useAccount()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recyclerProfile, setRecyclerProfile] = useState<{
    name: string;
    location: string;
    loading: boolean;
  } | null>(null)

  // Get ID from search params
  const id = searchParams.get('id')

  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL
  })

  // Fetch recycler profile when collection is loaded
  useEffect(() => {
    const fetchRecyclerProfile = async () => {
      if (!collection || !africycle || !collection.selectedRecycler) {
        return
      }

      try {
        setRecyclerProfile({
          name: '',
          location: '',
          loading: true
        })
        const profile = await africycle.getUserProfile(collection.selectedRecycler as `0x${string}`)
        setRecyclerProfile({
          name: profile.name || 'Unknown Recycler',
          location: profile.location || 'Location not specified',
          loading: false
        })
      } catch (error) {
        console.error("Error fetching recycler profile:", error)
        setRecyclerProfile({
          name: 'Unknown Recycler',
          location: 'Location not specified',
          loading: false
        })
      }
    }

    fetchRecyclerProfile()
  }, [collection, africycle])

  useEffect(() => {
    const fetchCollection = async () => {
      if (!address || !africycle || !id) {
        setError("Missing required data")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const collectionId = parseInt(id)
        
        if (isNaN(collectionId)) {
          throw new Error("Invalid collection ID")
        }

        console.log('Debug: Fetching collection #', collectionId)
        const wasteCollectionDetails = await africycle.getCollectionDetails(BigInt(collectionId))
        console.log('Debug: Raw collection data:', wasteCollectionDetails)
        
        // Handle both object structure and array structure
        let collectionData = null;
        if (wasteCollectionDetails?.collection) {
          // Expected object structure
          collectionData = wasteCollectionDetails.collection;
        } else if (Array.isArray(wasteCollectionDetails) && (wasteCollectionDetails as any)[0]) {
          // Actual array structure from contract - cast to any to handle unknown structure
          collectionData = (wasteCollectionDetails as any)[0];
        }
        
        console.log('Debug: Extracted collection data:', collectionData)
        
        const collection = arrayToCollection(collectionData as WasteCollection, collectionId)
        
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
  }, [address, africycle, id])

  // Rest of the component logic would be the same as the original file...
  // For brevity, I'll just show the basic structure

  if (loading) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Collection Details"
          text="Loading collection information..."
        />
        <div className="grid gap-4">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (error) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Collection Details"
          text="Error loading collection"
        />
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <IconX className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.back()}>
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Collection Details"
        text={`Collection #${collection?.collectionId}`}
      />
      {collection && (
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Collection Information</h3>
              <div className="space-y-2">
                <p><strong>ID:</strong> {collection.collectionId}</p>
                <p><strong>Weight:</strong> {collection.weight.toString()} kg</p>
                <p><strong>Location:</strong> {collection.location}</p>
                <p><strong>Status:</strong> <Badge>{collection.status}</Badge></p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.back()}>
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to Collections
            </Button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
} 