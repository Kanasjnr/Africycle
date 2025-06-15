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
            <Popup maxWidth={300}>
              <div className="p-2 min-w-[250px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{recycler.name}</h3>
                  <Badge 
                    variant={
                      recycler.status === "active" ? "default" : 
                      recycler.status === "busy" ? "secondary" : "outline"
                    }
                  >
                    {recycler.status}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 mb-2">{recycler.address}</p>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500">Reputation:</span>
                  <span className="text-xs font-medium text-green-600">{recycler.reputationScore}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">Inventory:</span>
                  <span className="text-xs font-medium">{recycler.totalInventory}</span>
                </div>
                
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
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs px-2 py-1"
                    onClick={() => navigator.clipboard.writeText(recycler.recyclerAddress)}
                  >
                    Copy Address
                  </Button>
                  {recycler.status === "active" && (
                    <Button 
                      size="sm" 
                      className="text-xs px-2 py-1"
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