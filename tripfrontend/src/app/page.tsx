"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface Itinerary {
  id: number
  name: string
  description: string
  duration: number
  destination: string
  price: number
  rating: number
  image: string
  status: string
}

// Add this function after the imports
const getPriceSymbol = (price: number): string => {
  if (price <= 500) return "$"
  if (price <= 1000) return "$$"
  return "$$$"
}

export default function Home() {
  const [featuredItineraries, setFeaturedItineraries] = useState<Itinerary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/itineraries/")
        if (!response.ok) {
          throw new Error("Failed to fetch itineraries")
        }
        const data = await response.json()
        setFeaturedItineraries(data.slice(0, 3)) // Get first 3 itineraries
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchItineraries()
  }, [])

  if (loading) {
    return <div className="container py-8 text-center">Loading...</div>
  }

  if (error) {
    return <div className="container py-8 text-center text-red-500">{error}</div>
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/placeholder.svg?height=1080&width=1920"
            alt="Travel background"
            fill
            className="object-cover opacity-20"
            priority
          />
        </div>
        <div className="container relative z-10 flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Plan Your Perfect Trip with <span className="text-primary">TripTailor</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl">
            Discover curated travel itineraries from locals and experienced travelers. Make trip planning simple, fun,
            and stress-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Link href="/register">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="px-8">
                Explore Itineraries
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">How TripTailor Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Search Itineraries</h3>
              <p className="text-muted-foreground">
                Find the perfect itinerary by searching for your destination, duration, and budget.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Save Favorites</h3>
              <p className="text-muted-foreground">
                Save itineraries you love to your favorites list for easy access later.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-lg shadow-sm">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Chatbot</h3>
              <p className="text-muted-foreground">
                Get personalized itinerary suggestions from our AI chatbot based on your preferences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Itineraries */}
      <section className="py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Itineraries</h2>
            <Link href="/search">
              <Button variant="ghost">View All</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredItineraries.map((itinerary) => (
              <Link key={itinerary.id} href={`/itinerary/${itinerary.id}`} className="group">
                <div className="rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={itinerary.image || "/placeholder.svg"}
                      alt={itinerary.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{itinerary.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{itinerary.description}</p>
                    <div className="flex justify-between items-center">
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
                        <span className="text-sm">{Number(itinerary.rating).toFixed(1)}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {itinerary.duration} days · {getPriceSymbol(itinerary.price)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container">
          <div className="bg-primary text-primary-foreground rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Plan Your Next Adventure?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of travelers who have discovered the perfect itineraries for their dream destinations.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="px-8">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

