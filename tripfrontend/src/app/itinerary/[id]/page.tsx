"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, Share2, MapPin, Calendar, DollarSign, Star, Pencil, Trash2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import dynamic from "next/dynamic"
import { useSession } from "next-auth/react"

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
    email: string
    id: number
  }
  days: Array<{
    day_number: number
    title: string
    description: string
    stops: Array<{
      id: number
      name: string
      description: string
      stop_type: string
      latitude: string
      longitude: string
      order: number
    }>
  }>
}

interface Review {
  id: number
  user: {
    id: number
    first_name: string
    last_name: string
  }
  rating: number
  comment: string
  created_at: string
}

const getPriceSymbol = (price: number): string => {
  if (price <= 500) return "$"
  if (price <= 1000) return "$$"
  return "$$$"
}

// Dynamically import the map component to avoid SSR issues
const ItineraryMap = dynamic(
  () => import("@/components/map/GoogleMap"),
  { ssr: false }
)

export default function ItineraryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  const id = params.id as string
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [reviewText, setReviewText] = useState("")
  const [rating, setRating] = useState(0)
  const [reviews, setReviews] = useState<Review[]>([])
  const [newReview, setNewReview] = useState({
    rating: 0,
    comment: ''
  })
  const [hasReviewed, setHasReviewed] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editReviewData, setEditReviewData] = useState({
    rating: 0,
    comment: ''
  })

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/itineraries/${id}/`)
        if (!response.ok) {
          throw new Error("Failed to fetch itinerary")
        }
        const data = await response.json()
        console.log("API Response:", data)
        
        // Check for missing or empty days array and handle it
        if (!data.days) {
          console.log("No days data found in API response, adding empty array")
          data.days = []
        }
        
        // Ensure each day has a stops array
        data.days.forEach((day: {day_number: number, stops?: any[]}) => {
          if (!day.stops) {
            console.log(`No stops array for day ${day.day_number}, adding empty array`)
            day.stops = []
          }
        })
        
        console.log("Processed itinerary data:", data)
        console.log("Current user from localStorage:", localStorage.getItem('username'))
        console.log("Itinerary user:", data.user?.username)
        console.log("Should show edit button:", data.user?.id.toString() === localStorage.getItem('userId'))
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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        console.log('Fetching reviews for itinerary:', id)
        // Don't require token for GET requests
        const response = await fetch(`http://localhost:8000/api/itineraries/${id}/reviews/`)
        console.log('Reviews API response status:', response.status)
        
        if (!response.ok) {
          let errorMessage = "Failed to fetch reviews"
          
          // Check content type to handle both JSON and non-JSON responses
          const contentType = response.headers.get('content-type')
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json()
              // Check if errorData has a meaningful error message
              if (errorData && typeof errorData === 'object' && errorData.error) {
                errorMessage = errorData.error
                console.error('Reviews API error:', errorData.error)
              } else {
                console.error('Reviews API returned error status with no details')
              }
            } catch (e) {
              console.error('Failed to parse JSON error response:', e)
            }
          } else {
            // Non-JSON response (likely HTML error page)
            const responseText = await response.text()
            console.error('Received non-JSON response:', responseText.substring(0, 150) + '...')
          }
          
          // Don't throw an error, just log it and continue with empty reviews
          console.error(errorMessage)
          setReviews([])
          return
        }

        const data = await response.json()
        console.log('Reviews data:', data)
        setReviews(data)
        
        const userId = session?.user?.id
        if (userId) {
          const userReview = data.find((review: Review) => review.user.id.toString() === userId)
          setHasReviewed(!!userReview)
        }
      } catch (err) {
        console.error("Error fetching reviews:", err)
        setReviews([])
      }
    }

    fetchReviews()
  }, [id, session?.user?.id])

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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "You must be logged in to submit a review",
        variant: "destructive"
      })
      return
    }
    const token = session.user.token

    try {
      const response = await fetch(`http://localhost:8000/api/itineraries/${id}/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          rating: newReview.rating,
          comment: newReview.comment
        })
      })

      if (!response.ok) {
        const responseText = await response.text() // Read raw text first
        console.error('[handleSubmitReview] Raw error response text:', responseText)
        let errorMessage = "Failed to submit review"

        try {
          // Attempt to parse the response as JSON
          const errorData = JSON.parse(responseText)
          console.error('[handleSubmitReview] Parsed error data:', errorData)
          errorMessage = errorData.detail || errorData.error || JSON.stringify(errorData)
        } catch (parseError) {
          // If parsing fails, use the raw text (if short) or a generic message
          console.error('[handleSubmitReview] Failed to parse response as JSON:', parseError)
          errorMessage = responseText.length < 100 ? responseText : "Server error (non-JSON response)"
        }
        
        throw new Error(errorMessage)
      }

      // Parse the successful response
      const data = await response.json()
      setReviews([data, ...reviews])
      setHasReviewed(true)
      setNewReview({ rating: 0, comment: '' })
      
      toast({
        title: "Success",
        description: "Your review has been submitted!",
      })
    } catch (err) {
      console.error("Error submitting review:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit review",
        variant: "destructive"
      })
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
      .then(() => {
        toast({
          title: "Link copied!",
          description: "The itinerary link has been copied to your clipboard.",
        })
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to copy the link. Please try again.",
          variant: "destructive"
        })
      })
  }

  const handleDeleteReview = async (reviewId: number) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "You must be logged in to delete a review",
        variant: "destructive"
      })
      return
    }
    const token = session.user.token

    try {
      const response = await fetch(`http://localhost:8000/api/reviews/${reviewId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to delete review")
      }

      // Remove the deleted review from the state
      setReviews(reviews.filter(review => review.id !== reviewId))
      setHasReviewed(false)
      
      toast({
        title: "Success",
        description: "Your review has been deleted!",
      })
    } catch (err) {
      console.error("Error deleting review:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete review",
        variant: "destructive"
      })
    }
  }

  const handleEditReview = async (reviewId: number) => {
    if (status !== "authenticated" || !session?.user?.token) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a review",
        variant: "destructive"
      })
      return
    }
    const token = session.user.token

    try {
      const response = await fetch(`http://localhost:8000/api/reviews/${reviewId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(editReviewData)
      })

      if (!response.ok) {
        throw new Error("Failed to update review")
      }

      const data = await response.json()
      setReviews(reviews.map(review => review.id === reviewId ? data : review))
      setEditingReview(null)
      setEditReviewData({ rating: 0, comment: '' })
      
      toast({
        title: "Success",
        description: "Your review has been updated!",
      })
    } catch (err) {
      console.error("Error updating review:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update review",
        variant: "destructive"
      })
    }
  }

  const handleDeleteItinerary = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      toast({
        title: "Error",
        description: "You must be logged in to delete an itinerary",
        variant: "destructive"
      })
      return
    }

    // Show confirmation dialog
    if (!confirm("Are you sure you want to delete this itinerary? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/api/user/itineraries/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to delete itinerary")
      }

      toast({
        title: "Success",
        description: "Itinerary deleted successfully!",
      })

      router.push('/')
    } catch (err) {
      console.error("Error deleting itinerary:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete itinerary",
        variant: "destructive"
      })
    }
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
              {itinerary.user?.id.toString() === session?.user?.id && (
                <>
                  <Link href={`/itinerary/${itinerary.id}/edit`}>
                    <Button variant="outline" size="icon" aria-label="Edit itinerary">
                      <Pencil size={20} />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDeleteItinerary}
                    aria-label="Delete itinerary"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={20} />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart className={isFavorite ? "fill-red-500 text-red-500" : ""} size={20} />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                aria-label="Share itinerary"
                onClick={handleShare}
              >
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
              <DollarSign size={16} className=""/>:
              <span className="mx-1">{getPriceSymbol(itinerary.price)}</span>
            </div>
          </div>

          <Tabs defaultValue="overview" onValueChange={setActiveTab}>
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
                  <Link 
                    href={`/creator/${itinerary.user?.id}`}
                    className="font-medium hover:underline"
                  >
                    {itinerary.user?.first_name && itinerary.user?.last_name 
                      ? `${itinerary.user.first_name} ${itinerary.user.last_name}`
                      : 'Unknown User'}
                  </Link>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="itinerary" className="space-y-6">
              {itinerary.days && itinerary.days.map((day) => (
                <div key={day.day_number} className="space-y-4">
                  <h3 className="text-xl font-semibold">Day {day.day_number}</h3>
                  {day.stops && day.stops.length > 0 ? (
                    <div className="space-y-4">
                      {day.stops.map((stop, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between">
                            <h4 className="font-medium">{stop.name}</h4>
                            <span className="text-xs px-2 py-1 bg-muted rounded-full">
                              {stop.stop_type.charAt(0).toUpperCase() + stop.stop_type.slice(1)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{stop.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No stops planned for this day.</p>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="map">
              {itinerary.days && itinerary.days.length > 0 ? (
                <ItineraryMap days={itinerary.days} />
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">No stops available to display on the map</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              {!hasReviewed && (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <h3 className="text-xl font-semibold">Write a Review</h3>

                  <div className="space-y-2">
                    <Label htmlFor="rating">Rating</Label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="focus:outline-none bg-gray-100 rounded-full p-1"
                        >
                          <Star
                            size={24}
                            className={star <= newReview.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="review">Your Review</Label>
                    <Textarea
                      id="review"
                      placeholder="Share your experience with this itinerary..."
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={newReview.rating === 0 || !newReview.comment.trim()}>
                    Submit Review
                  </Button>
                </form>
              )}

              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Reviews</h3>
                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      {editingReview?.id === review.id ? (
                        <form onSubmit={(e) => {
                          e.preventDefault()
                          handleEditReview(review.id)
                        }} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-rating">Rating</Label>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setEditReviewData({ ...editReviewData, rating: star })}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    size={24}
                                    className={star <= editReviewData.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="edit-review">Your Review</Label>
                            <Textarea
                              id="edit-review"
                              value={editReviewData.comment}
                              onChange={(e) => setEditReviewData({ ...editReviewData, comment: e.target.value })}
                              rows={4}
                              required
                            />
                          </div>

                          <div className="flex space-x-2">
                            <Button type="submit">Save Changes</Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setEditingReview(null)
                                setEditReviewData({ rating: 0, comment: '' })
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">
                                {review.user.first_name} {review.user.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    className={i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"}
                                  />
                                ))}
                              </div>
                              {review.user.id.toString() === session?.user?.id && (
                                <div className="flex space-x-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingReview(review)
                                      setEditReviewData({
                                        rating: review.rating,
                                        comment: review.comment
                                      })
                                    }}
                                  >
                                    <Pencil size={16} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteReview(review.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="mt-2">{review.comment}</p>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
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
              <Button variant="outline" className="w-full" onClick={handleShare}>
                Share Itinerary
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}