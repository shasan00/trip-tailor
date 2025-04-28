"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { fetchAPI } from "@/lib/api"
import { PlusCircle, MapPin } from "lucide-react"

// Define the structure for an itinerary (consider moving to a shared types file)
interface Itinerary {
  id: number
  name: string
  description: string
  destination: string
  duration: number
  price: number
  image: string
  status: 'draft' | 'published'
}

const getPriceSymbol = (price: number): string => {
  if (price <= 500) return "$"
  if (price <= 1000) return "$$"
  return "$$$"
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [itineraries, setItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      const fetchUserItineraries = async () => {
        setLoading(true)
        setError(null)
        try {
          const data = await fetchAPI("/api/user/itineraries/")
          if (Array.isArray(data)) {
            setItineraries(data)
          } else {
            throw new Error("Invalid API response format")
          }
        } catch (err) {
          console.error("Error fetching user itineraries:", err)
          setError(err instanceof Error ? err.message : "Failed to load your itineraries.")
        } finally {
          setLoading(false)
        }
      }
      fetchUserItineraries()
    } else if (status === "unauthenticated") {
      // Middleware should handle redirection, but as a fallback:
      setLoading(false)
      setError("Please log in to view your profile.")
    }
  }, [status])

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading your itineraries...</p>
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Itineraries</h1>
        <Link href="/create">
          <Button>
            <PlusCircle size={16} className="mr-2" />
            Create New Itinerary
          </Button>
        </Link>
      </div>

      {itineraries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {itineraries.map((itinerary) => (
            <Link key={itinerary.id} href={`/itinerary/${itinerary.id}`} className="group">
              {/* Using similar card structure as search page */}
              <div className="rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md h-full flex flex-col">
                <div className="relative h-48 w-full overflow-hidden">
                  {itinerary.image ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}${itinerary.image}`}
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
                  {/* Add status badge if needed */}
                  {itinerary.status === 'draft' && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
                      Draft
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
      ) : (
        <div className="text-center py-12 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-2">You haven't created any itineraries yet.</h2>
          <p className="text-muted-foreground mb-4">Start planning your next adventure!</p>
          <Link href="/create">
            <Button>
              <PlusCircle size={16} className="mr-2" />
              Create Your First Itinerary
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
} 