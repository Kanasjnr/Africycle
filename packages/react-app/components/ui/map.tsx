"use client"

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Badge } from './badge'
import { Button } from './button'
import { IconNavigation, IconMapPin } from '@tabler/icons-react'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createRecyclerIcon = (status: string, isActive: boolean = true) => {
  const color = isActive ? (status === 'active' ? '#22c55e' : status === 'busy' ? '#f59e0b' : '#6b7280') : '#6b7280'
  
  return new L.DivIcon({
    html: `
      <div style="
        background-color: ${color}; 
        width: 24px; 
        height: 24px; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        font-weight: bold;
      ">
        ♻
      </div>
    `,
    className: 'custom-recycler-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

const createUserLocationIcon = () => {
  return new L.DivIcon({
    html: `
      <div style="
        background-color: #3b82f6; 
        width: 20px; 
        height: 20px; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        position: relative;
      ">
        <div style="
          background-color: #3b82f6; 
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          position: absolute;
          top: -13px;
          left: -13px;
          opacity: 0.3;
          animation: pulse 2s infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.2; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
      </style>
    `,
    className: 'custom-user-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

interface RecyclerLocation {
  id: string
  name: string
  position: [number, number]
  address: string
  status: 'active' | 'busy' | 'offline'
  acceptedMaterials: string[]
  reputationScore: string
  totalInventory: string
  recyclerAddress: string
  // Add comprehensive data fields
  activeCollectors?: string
  availableListings?: string
  inventoryDetails?: {
    totalWeight: number
    itemCount: number
    availableListings: number
  }
  activeCollectorsCount?: number
  totalProcessed?: number
  completedCollections?: number
}

interface RecyclerMapProps {
  recyclers: RecyclerLocation[]
  userLocation?: { lat: number; lng: number } | null
  center?: [number, number]
  zoom?: number
  height?: string
  onRecyclerSelect?: (recycler: RecyclerLocation) => void
  onNavigate?: (recycler: RecyclerLocation) => void
}

// Component to update map view when user location changes
function MapUpdater({ userLocation, recyclers }: { userLocation?: { lat: number; lng: number } | null, recyclers: RecyclerLocation[] }) {
  const map = useMap()
  
  useEffect(() => {
    if (userLocation && recyclers.length > 0) {
      // Create bounds that include user location and all recyclers
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        ...recyclers.map(r => r.position)
      ])
      
      // Fit map to show all points with some padding
      map.fitBounds(bounds, { padding: [20, 20] })
    } else if (userLocation) {
      // Just center on user location
      map.setView([userLocation.lat, userLocation.lng], 13)
    } else if (recyclers.length > 0) {
      // Center on recyclers
      const bounds = L.latLngBounds(recyclers.map(r => r.position))
      map.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [map, userLocation, recyclers])
  
  return null
}

export function RecyclerMap({
  recyclers,
  userLocation,
  center = [0, 0], // Default to [0, 0], will be updated by MapUpdater
  zoom = 10,
  height = "400px",
  onRecyclerSelect,
  onNavigate
}: RecyclerMapProps) {
  // Default center - will be overridden by MapUpdater
  const defaultCenter: [number, number] = userLocation 
    ? [userLocation.lat, userLocation.lng] 
    : recyclers.length > 0 
      ? recyclers[0].position 
      : [6.5244, 3.3792] // Lagos, Nigeria as fallback

  return (
    <div style={{ height, width: '100%' }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater userLocation={userLocation} recyclers={recyclers} />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={createUserLocationIcon()}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-medium text-sm">Your Location</h3>
                <p className="text-xs text-gray-600 mt-1">
                  You are here
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Recycler markers */}
        {recyclers.map((recycler) => (
          <Marker
            key={recycler.id}
            position={recycler.position}
            icon={createRecyclerIcon(recycler.status)}
            eventHandlers={{
              click: () => onRecyclerSelect?.(recycler)
            }}
          >
            <Popup maxWidth={320}>
              <div className="p-3 min-w-[280px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-base">{recycler.name}</h3>
                  <Badge 
                    variant={
                      recycler.status === "active" ? "default" : 
                      recycler.status === "busy" ? "secondary" : "outline"
                    }
                    className="text-xs"
                  >
                    {recycler.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{recycler.address}</p>
                
                {/* Comprehensive Data Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs text-gray-500">Reputation:</span>
                      <span className="text-xs font-semibold text-green-600">{recycler.reputationScore}</span>
                    </div>
                    <div className="text-xs text-gray-400">Trust Score</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xs text-gray-500">Inventory:</span>
                      <span className="text-xs font-semibold text-blue-600">{recycler.totalInventory}</span>
                    </div>
                    <div className="text-xs text-gray-400">Total Stock</div>
                  </div>
                  
                  {recycler.activeCollectors && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-gray-500">Active:</span>
                        <span className="text-xs font-semibold text-purple-600">{recycler.activeCollectors}</span>
                      </div>
                      <div className="text-xs text-gray-400">Collectors</div>
                    </div>
                  )}
                  
                  {recycler.availableListings && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-gray-500">Available:</span>
                        <span className="text-xs font-semibold text-orange-600">{recycler.availableListings}</span>
                      </div>
                      <div className="text-xs text-gray-400">For Sale</div>
                    </div>
                  )}
                </div>
                
                {/* Detailed Inventory Info */}
                {recycler.inventoryDetails && (
                  <div className="bg-blue-50 rounded-lg p-2 mb-3">
                    <p className="text-xs font-medium text-blue-800 mb-1">📦 Inventory Details</p>
                    <div className="text-xs text-blue-700">
                      <span className="font-semibold">{recycler.inventoryDetails.totalWeight}kg</span> total weight • 
                      <span className="font-semibold"> {recycler.inventoryDetails.itemCount}</span> items • 
                      <span className="font-semibold"> {recycler.inventoryDetails.availableListings}</span> available
                    </div>
                  </div>
                )}
                
                {/* Performance Stats */}
                {(recycler.totalProcessed || recycler.completedCollections) && (
                  <div className="bg-green-50 rounded-lg p-2 mb-3">
                    <p className="text-xs font-medium text-green-800 mb-1">⚡ Performance</p>
                    <div className="text-xs text-green-700">
                      {recycler.totalProcessed ? (
                        <span><span className="font-semibold">{recycler.totalProcessed}kg</span> processed • </span>
                      ) : null}
                      {recycler.completedCollections ? (
                        <span><span className="font-semibold">{recycler.completedCollections}</span> completed</span>
                      ) : null}
                    </div>
                  </div>
                )}
                
                {/* Accepted Materials */}
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">Accepted Materials:</p>
                  <div className="flex flex-wrap gap-1">
                    {recycler.acceptedMaterials.slice(0, 3).map((material) => (
                      <Badge key={material} variant="outline" className="text-xs">
                        {material}
                      </Badge>
                    ))}
                    {recycler.acceptedMaterials.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{recycler.acceptedMaterials.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs px-3 py-1 flex-1"
                    onClick={() => navigator.clipboard.writeText(recycler.recyclerAddress)}
                  >
                    Copy Address
                  </Button>
                  {recycler.status === "active" && (
                    <Button 
                      size="sm" 
                      className="text-xs px-3 py-1 flex-1"
                      onClick={() => onNavigate?.(recycler)}
                    >
                      <IconNavigation className="mr-1 h-3 w-3" />
                      Navigate
                    </Button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

// Map container with loading state
export function MapWithLoading({ 
  loading, 
  error, 
  children 
}: { 
  loading?: boolean
  error?: string | null
  children: React.ReactNode 
}) {
  if (loading) {
    return (
      <div className="h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <IconMapPin className="h-12 w-12 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Failed to load map</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 