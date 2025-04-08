"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { mockItineraries } from "@/lib/mock-data"
import type { Itinerary } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"

// Add this function after the imports
const getPriceSymbol = (price: number): string => {
  if (price <= 500) return "$"
  if (price <= 1000) return "$$"
  return "$$$"
}

export default function SearchPage() {
  const [destination, setDestination] = useState("")
  const [duration, setDuration] = useState([1, 14])
  const [price, setPrice] = useState<string[]>([])
  const [filteredItineraries, setFilteredItineraries] = useState<Itinerary[]>(mockItineraries)

  const handleSearch = () => {
    const filtered = mockItineraries.filter((itinerary) => {
      const matchesDestination =
        destination === "" || itinerary.destination.toLowerCase().includes(destination.toLowerCase())
      const matchesDuration = itinerary.duration >= duration[0] && itinerary.duration <= duration[1]

      // Price filtering logic
      let matchesPrice = true
      if (price.length > 0) {
        if (price.includes("$") && itinerary.price <= 500) {
          matchesPrice = true
        } else if (price.includes("$$") && itinerary.price > 500 && itinerary.price <= 1000) {
          matchesPrice = true
        } else if (price.includes("$$$") && itinerary.price > 1000) {
          matchesPrice = true
        } else {
          matchesPrice = false
        }
      }

      return matchesDestination && matchesDuration && matchesPrice
    })

    setFilteredItineraries(filtered)
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
                  <Image
                    src={itinerary.image || "/placeholder.svg"}
                    alt={itinerary.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-2">{itinerary.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{itinerary.shortDescription}</p>
                  <div className="flex justify-between items-center mt-auto">
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-yellow-500 mr-1"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="text-sm">{itinerary.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground ml-1">({itinerary.reviewCount})</span>
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

