"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"

interface Itinerary {
  id: number
  name: string
  description: string
  destination: string
  duration: number
  price: number
  image: string
  user: {
    username: string
  }
}

const getPriceSymbol = (price: number): string => {
  if (price <= 500) return "$"
  if (price <= 1000) return "$$"
  return "$$$"
}

export default function SearchPage() {
  const [destination, setDestination] = useState("")
  const [duration, setDuration] = useState([1, 14])
  const [price, setPrice] = useState<string[]>([])
  const [allItineraries, setAllItineraries] = useState<Itinerary[]>([])
  const [filteredItineraries, setFilteredItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItineraries()
  }, [])

  const fetchItineraries = async () => {
    try {
      console.log("Fetching itineraries from API...")
      const response = await fetch("http://localhost:8000/api/itineraries/", {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      console.log("API Response status:", response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error response:", errorText)
        throw new Error(`Failed to fetch itineraries: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      console.log("API Response data:", data)
      
      if (!Array.isArray(data)) {
        console.error("API Response is not an array:", data)
        throw new Error("Invalid API response format")
      }
      
      if (data.length === 0) {
        console.log("No itineraries found in the API response")
      } else {
        console.log(`Found ${data.length} itineraries`)
      }
      
      setAllItineraries(data)
      setFilteredItineraries(data)
    } catch (error) {
      console.error("Error fetching itineraries:", error)
      // Set empty arrays on error
      setAllItineraries([])
      setFilteredItineraries([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    console.log("Search button clicked")
    console.log("Current search criteria:", {
      destination,
      duration,
      price
    })

    // If no search criteria are provided, show all itineraries
    if (!destination && duration[0] === 1 && duration[1] === 14 && price.length === 0) {
      console.log("No search criteria, showing all itineraries")
      setFilteredItineraries(allItineraries)
      return
    }

    console.log("Filtering itineraries...")
    const filtered = allItineraries.filter((itinerary) => {
      const matchesDestination = !destination || 
        itinerary.destination.toLowerCase().includes(destination.toLowerCase())
      const matchesDuration = itinerary.duration >= duration[0] && 
        itinerary.duration <= duration[1]
      const matchesPrice = price.length === 0 || 
        price.includes(getPriceSymbol(itinerary.price))

      console.log(`Itinerary ${itinerary.id}:`, {
        matchesDestination,
        matchesDuration,
        matchesPrice
      })

      return matchesDestination && matchesDuration && matchesPrice
    })

    console.log("Filtered results:", filtered)
    setFilteredItineraries(filtered)
  }

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading itineraries...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Find Your Perfect Itinerary</h1>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="e.g. Paris, Tokyo, New York"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label>
                Duration (days): {duration[0]} - {duration[1]}
              </Label>
              <Slider defaultValue={[1, 14]} min={1} max={30} step={1} value={duration} onValueChange={setDuration} />
            </div>

            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={price.includes("$") ? "default" : "outline"}
                  onClick={() => {
                    if (price.includes("$")) {
                      setPrice(price.filter((p) => p !== "$"))
                    } else {
                      setPrice([...price, "$"])
                    }
                  }}
                  className="flex-1"
                >
                  $
                </Button>
                <Button
                  type="button"
                  variant={price.includes("$$") ? "default" : "outline"}
                  onClick={() => {
                    if (price.includes("$$")) {
                      setPrice(price.filter((p) => p !== "$$"))
                    } else {
                      setPrice([...price, "$$"])
                    }
                  }}
                  className="flex-1"
                >
                  $$
                </Button>
                <Button
                  type="button"
                  variant={price.includes("$$$") ? "default" : "outline"}
                  onClick={() => {
                    if (price.includes("$$$")) {
                      setPrice(price.filter((p) => p !== "$$$"))
                    } else {
                      setPrice([...price, "$$$"])
                    }
                  }}
                  className="flex-1"
                >
                  $$$
                </Button>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={handleSearch} className="w-full">
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredItineraries.length > 0 ? (
          filteredItineraries.map((itinerary) => (
            <Link key={itinerary.id} href={`/itinerary/${itinerary.id}`} className="group">
              <div className="rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md h-full flex flex-col">
                <div className="relative h-48 w-full overflow-hidden">
                  {itinerary.image ? (
                    <img
                      src={`http://localhost:8000${itinerary.image}`}
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
                      <span className="text-sm">{itinerary.destination}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {itinerary.duration} days · {getPriceSymbol(itinerary.price)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-3 text-center py-12">
            <h3 className="text-xl font-semibold mb-2">No itineraries found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

