"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Itinerary {
  id: number
  name: string
  description: string
  destination: string
  duration: number
  price: number
  image: string
  user: {
    id: number
    first_name: string
    last_name: string
    username: string
  }
}

const getPriceSymbol = (price: number): string => {
  if (price <= 500) return "$"
  if (price <= 1000) return "$$"
  return "$$$"
}

export default function CreatorItinerariesPage() {
  const params = useParams()
  const creatorId = params.id as string
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [creatorName, setCreatorName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCreatorItineraries = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`http://localhost:8000/api/itineraries/creator/${creatorId}/`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch itineraries")
        }
        
        const data = await response.json()
        setItineraries(data)
        
        // Set creator name from the first itinerary if available
        if (data.length > 0 && data[0].user) {
          const user = data[0].user
          setCreatorName(`${user.first_name} ${user.last_name}`)
        }
      } catch (err) {
        console.error("Error fetching itineraries:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchCreatorItineraries()
  }, [creatorId])

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading itineraries...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">
        {creatorName ? `Itineraries by ${creatorName}` : "Creator Itineraries"}
      </h1>

      {itineraries.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No published itineraries found for this creator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {itineraries.map((itinerary) => (
            <Link key={itinerary.id} href={`/itinerary/${itinerary.id}`} className="group">
              <div className="rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md h-full flex flex-col">
                <div className="relative h-48 w-full overflow-hidden">
                  {itinerary.image ? (
                    <img
                      src={itinerary.image.startsWith('http') ? itinerary.image : `http://localhost:8000${itinerary.image}`}
                      alt={itinerary.name}
                      className="object-cover w-full h-full transition-transform group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full bg-muted flex items-center justify-center">
                              <span class="text-muted-foreground">Image not available</span>
                            </div>
                          `
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-2">{itinerary.name}</h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">{itinerary.description}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center">
                      <MapPin size={16} className="text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">{itinerary.destination}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{itinerary.duration} days</span>
                      <span>{getPriceSymbol(itinerary.price)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
} 