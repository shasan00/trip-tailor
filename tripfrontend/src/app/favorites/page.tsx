"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"

interface Itinerary {
  id: number
  name: string
  description: string
  destination: string
  duration: number
  price: number
  image: string
  user: {
    first_name: string
    last_name: string
  }
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    setFavorites(savedFavorites)
    setLoading(false)
  }, [])

  const removeFromFavorites = (id: number) => {
    const newFavorites = favorites.filter(itinerary => itinerary.id !== id)
    setFavorites(newFavorites)
    localStorage.setItem('favorites', JSON.stringify(newFavorites))
  }

  if (loading) {
    return (
      <div className="container py-8 text-center">
        <p className="text-lg">Loading favorites...</p>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">No Favorites Yet</h1>
        <p className="text-muted-foreground mb-8">
          You haven't added any itineraries to your favorites yet.
        </p>
        <Link href="/search">
          <Button>Explore Itineraries</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Your Favorites</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((itinerary) => (
          <div key={itinerary.id} className="border rounded-lg overflow-hidden bg-card">
            <div className="relative">
              <Link href={`/itinerary/${itinerary.id}`}>
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={itinerary.image}
                    alt={itinerary.name}
                    className="object-cover w-full h-full transition-transform hover:scale-105"
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
                <h3 className="text-lg font-semibold mb-2 hover:text-primary">{itinerary.name}</h3>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">{itinerary.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm">{itinerary.destination}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {itinerary.duration} days · {getPriceSymbol(itinerary.price)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const getPriceSymbol = (price: number): string => {
  if (price <= 500) return "$"
  if (price <= 1000) return "$$"
  return "$$$"
}

