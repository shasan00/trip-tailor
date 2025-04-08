"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { mockItineraries } from "@/lib/mock-data"
import type { Itinerary } from "@/lib/types"
import { Heart, Star } from "lucide-react"

export default function FavoritesPage() {
  // In a real app, this would come from a database or API
  const [favorites, setFavorites] = useState<Itinerary[]>(mockItineraries.slice(0, 2))

  const removeFromFavorites = (id: string) => {
    setFavorites(favorites.filter((itinerary) => itinerary.id !== id))
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Your Favorite Itineraries</h1>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((itinerary) => (
            <div key={itinerary.id} className="border rounded-lg overflow-hidden bg-card">
              <div className="relative">
                <Link href={`/itinerary/${itinerary.id}`}>
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={itinerary.image || "/placeholder.svg"}
                      alt={itinerary.title}
                      fill
                      className="object-cover transition-transform hover:scale-105"
                    />
                  </div>
                </Link>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => removeFromFavorites(itinerary.id)}
                  aria-label="Remove from favorites"
                >
                  <Heart className="fill-current" size={16} />
                </Button>
              </div>

              <div className="p-4">
                <Link href={`/itinerary/${itinerary.id}`}>
                  <h3 className="text-lg font-semibold mb-2 hover:text-primary">{itinerary.title}</h3>
                </Link>
                <p className="text-sm text-muted-foreground mb-4">{itinerary.shortDescription}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Star size={16} className="text-yellow-500 mr-1" />
                    <span>{itinerary.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground ml-1">({itinerary.reviewCount})</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {itinerary.duration} days · ${itinerary.price}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Heart size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">No favorites yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            You haven't added any itineraries to your favorites yet. Browse our collection and save the ones you like!
          </p>
          <Link href="/search">
            <Button className="mt-4">Explore Itineraries</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

