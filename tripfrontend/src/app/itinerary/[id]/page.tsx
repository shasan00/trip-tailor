"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Share2, MapPin, Calendar, DollarSign, Star } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface Itinerary {
  id: number
  name: string
  description: string
  destination: string
  duration: number
  price: number
  image: string
  status: string
  user: {
    username: string
    first_name: string
    last_name: string
  }
  days: Array<{
    day_number: number
    title: string
    description: string
    activities: Array<{
      name: string
      description: string
      type: string
      location: string
    }>
  }>
}

const getPriceSymbol = (price: number): string => {
  if (price <= 500) return "$"
  if (price <= 1000) return "$$"
  return "$$$"
}

export default function ItineraryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewText, setReviewText] = useState("")
  const [rating, setRating] = useState(0)

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/itineraries/${id}/`)
        if (!response.ok) {
          throw new Error("Failed to fetch itinerary")
        }
        const data = await response.json()
        console.log("API Response:", data)
        console.log("User data:", data.user)
        setItinerary(data)
        
        // Check if this itinerary is in favorites
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
        setIsFavorite(favorites.some((fav: Itinerary) => fav.id === data.id))
      } catch (err) {
        console.error("Error fetching itinerary:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchItinerary()
  }, [id])

  if (loading) {
    return (
      <div className="container py-16 text-center">
        <p className="text-lg">Loading itinerary...</p>
      </div>
    )
  }

  if (error || !itinerary) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Itinerary Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The itinerary you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  const toggleFavorite = () => {
    if (!itinerary) return

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    let newFavorites

    if (isFavorite) {
      // Remove from favorites
      newFavorites = favorites.filter((fav: Itinerary) => fav.id !== itinerary.id)
    } else {
      // Add to favorites
      newFavorites = [...favorites, itinerary]
    }

    localStorage.setItem('favorites', JSON.stringify(newFavorites))
    setIsFavorite(!isFavorite)
  }

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the review to the server
    alert("Review submitted!")
    setReviewText("")
    setRating(0)
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="relative h-[400px] w-full rounded-lg overflow-hidden mb-6">
            <img
              src={itinerary.image}
              alt={itinerary.name}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{itinerary.name}</h1>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={isFavorite ? "fill-red-500 text-red-500" : ""} size={20} />
              </Button>
              <Button variant="outline" size="icon" aria-label="Share itinerary">
                <Share2 size={20} />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center text-muted-foreground">
              <MapPin size={16} className="mr-1" />
              <span>{itinerary.destination}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Calendar size={16} className="mr-1" />
              <span>{itinerary.duration} days</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <DollarSign size={16} className="mr-1" />
              <span>{getPriceSymbol(itinerary.price)}</span>
            </div>
          </div>

          <Tabs defaultValue="overview" value="overview">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <p>{itinerary.description}</p>

              <h3 className="text-xl font-semibold mt-6">Created by</h3>
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback>
                    {itinerary.user?.first_name ? itinerary.user.first_name.charAt(0) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {itinerary.user?.first_name && itinerary.user?.last_name 
                      ? `${itinerary.user.first_name} ${itinerary.user.last_name}`
                      : 'Unknown User'}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="itinerary" className="space-y-6">
              {itinerary.days.map((day) => (
                <div key={day.day_number} className="space-y-4">
                  <h3 className="text-xl font-semibold">Day {day.day_number}</h3>
                  {day.activities.length > 0 ? (
                    <div className="space-y-4">
                      {day.activities.map((activity, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{activity.name}</h4>
                            <span className="text-xs px-2 py-1 bg-muted rounded-full">
                              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{activity.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No activities planned for this day.</p>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="map">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Interactive map would be displayed here using Google Maps API</p>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <h3 className="text-xl font-semibold">Write a Review</h3>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                        <Star size={24} className={star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="review">Your Review</Label>
                  <Textarea
                    id="review"
                    placeholder="Share your experience with this itinerary..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button type="submit" disabled={rating === 0 || !reviewText.trim()}>
                  Submit Review
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <div className="border rounded-lg p-6 sticky top-20">
            <h3 className="text-xl font-semibold mb-4">Quick Info</h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-medium">{itinerary.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{itinerary.duration} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">{getPriceSymbol(itinerary.price)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full" onClick={toggleFavorite}>
                {isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </Button>
              <Button variant="outline" className="w-full">
                Share Itinerary
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

