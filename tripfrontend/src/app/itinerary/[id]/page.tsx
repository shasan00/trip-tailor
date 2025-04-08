"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { mockItineraries } from "@/lib/mock-data"
import { Heart, Share2, MapPin, Calendar, DollarSign, Star } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// Add this function after the imports
const getPriceSymbol = (price: number): string => {
  if (price <= 500) return "$"
  if (price <= 1000) return "$$"
  return "$$$"
}

export default function ItineraryDetailPage() {
  const params = useParams()
  const id = params.id as string

  // Find the itinerary with the matching ID
  const itinerary = mockItineraries.find((item) => item.id === id)

  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewText, setReviewText] = useState("")
  const [rating, setRating] = useState(0)

  if (!itinerary) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Itinerary Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The itinerary you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    )
  }

  const toggleFavorite = () => {
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
            <Image src={itinerary.image || "/placeholder.svg"} alt={itinerary.title} fill className="object-cover" />
          </div>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">{itinerary.title}</h1>
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
            <div className="flex items-center">
              <Star size={16} className="text-yellow-500 mr-1" />
              <span>{itinerary.rating.toFixed(1)}</span>
              <span className="text-muted-foreground ml-1">({itinerary.reviewCount} reviews)</span>
            </div>
          </div>

          <Tabs defaultValue="overview">
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
                  <AvatarImage src={itinerary.createdBy.image} alt={itinerary.createdBy.name} />
                  <AvatarFallback>{itinerary.createdBy.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{itinerary.createdBy.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Created on {new Date(itinerary.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="itinerary" className="space-y-6">
              {Array.from({ length: itinerary.duration }).map((_, dayIndex) => {
                const dayNumber = dayIndex + 1
                const dayStops = itinerary.stops.filter((stop) => stop.day === dayNumber)

                return (
                  <div key={dayNumber} className="space-y-4">
                    <h3 className="text-xl font-semibold">Day {dayNumber}</h3>
                    {dayStops.length > 0 ? (
                      <div className="space-y-4">
                        {dayStops.map((stop) => (
                          <div key={stop.id} className="border rounded-lg p-4">
                            <div className="flex justify-between">
                              <h4 className="font-medium">{stop.name}</h4>
                              <span className="text-xs px-2 py-1 bg-muted rounded-full">
                                {stop.type.charAt(0).toUpperCase() + stop.type.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">{stop.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No activities planned for this day.</p>
                    )}
                  </div>
                )
              })}
            </TabsContent>

            <TabsContent value="map">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Interactive map would be displayed here using Google Maps API</p>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <div className="space-y-4">
                {itinerary.reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={review.user.image} alt={review.user.name} />
                          <AvatarFallback>{review.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Star size={14} className="text-yellow-500" />
                        <span className="ml-1">{review.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <p className="text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>

              <Separator />

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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating</span>
                <div className="flex items-center">
                  <Star size={16} className="text-yellow-500 mr-1" />
                  <span>{itinerary.rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground ml-1">({itinerary.reviewCount})</span>
                </div>
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

