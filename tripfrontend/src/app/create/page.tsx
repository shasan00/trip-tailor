"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, MapPin } from "lucide-react"

interface Stop {
  id: string
  name: string
  description: string
  type: "activity" | "food" | "accommodation" | "transport"
  day: number
  order: number
  location: {
    lat: number
    lng: number
  }
}

export default function CreateItineraryPage() {
  const [title, setTitle] = useState("")
  const [destination, setDestination] = useState("")
  const [duration, setDuration] = useState(1)
  const [price, setPrice] = useState("$")
  const [description, setDescription] = useState("")
  // const [shortDescription, setShortDescription] = useState('');
  const [stops, setStops] = useState<Stop[]>([])
  const [currentTab, setCurrentTab] = useState("details")
  const [image, setImage] = useState<File | null>(null)
  const [additionalPhotos, setAdditionalPhotos] = useState<File[]>([])
  const [itineraryId, setItineraryId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const additionalPhotosRef = useRef<HTMLInputElement>(null)

  const addStop = (day: number) => {
    const newStop: Stop = {
      id: `new-${Date.now()}`,
      name: "",
      description: "",
      type: "activity",
      day,
      order: stops.filter((s) => s.day === day).length + 1,
      location: { lat: 0, lng: 0 },
    }

    setStops([...stops, newStop])
  }

  const updateStop = (id: string, field: keyof Stop, value: any) => {
    setStops(stops.map((stop) => (stop.id === id ? { ...stop, [field]: value } : stop)))
  }

  const removeStop = (id: string) => {
    setStops(stops.filter((stop) => stop.id !== id))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const handleAdditionalPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAdditionalPhotos(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const token = localStorage.getItem('token')
    console.log("Token from localStorage:", token)
    
    if (!token) {
      alert("You must be logged in to create an itinerary. Please log in and try again.")
      window.location.href = "/login" // Redirect to login page
      return
    }

    if (!image) {
      alert("Please upload a cover image for the itinerary")
      return
    }
    
    try {
      // First, create a FormData instance
      const formData = new FormData()
      
      // Add basic fields
      formData.append('name', title)
      formData.append('description', description) // This should be a string
      formData.append('duration', duration.toString())
      formData.append('destination', destination)
      formData.append('price', (price.length * 100).toString())
      formData.append('status', 'draft')
      
      // Add cover image
      formData.append('image', image)
      
      // Add additional photos
      additionalPhotos.forEach((photo) => {
        formData.append('photos', photo)
      })
      
      // Create days array
      const daysData = Array.from({ length: duration }).map((_, index) => ({
        day_number: index + 1,
        title: `Day ${index + 1}`,
        description: "",
        activities: stops
          .filter(stop => stop.day === index + 1)
          .map(stop => ({
            name: stop.name,
            description: stop.description,
            type: stop.type,
            location: stop.location
          }))
      }))
      
      // Add days as JSON string
      formData.append('days', JSON.stringify(daysData))

      // Log the form data for debugging
      console.log("Form data being sent:")
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value)
      }

      const response = await fetch("http://192.168.1.159:8000/api/user/itineraries/", {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`
        },
        body: formData
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      let errorData;
      try {
        errorData = await response.json()
        console.log("Response data:", errorData)
      } catch (e) {
        console.error("Failed to parse response as JSON:", e)
      }

      if (response.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('token') // Clear the invalid token
        alert("Your session has expired. Please log in again.")
        window.location.href = "/login"
        return
      }

      if (!response.ok) {
        // Log the specific validation errors if they exist
        if (errorData) {
          console.error("Validation errors:", errorData)
          const errorMessages = Object.entries(errorData)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('\n')
          throw new Error(`Validation errors:\n${errorMessages}`)
        }
        throw new Error(errorData?.detail || errorData?.error || "Failed to create itinerary")
      }

      const newItinerary = await response.json()
      setItineraryId(newItinerary.id)
      
      alert("Itinerary created successfully!")
      // Don't redirect yet, let the user publish if they want to
    } catch (error) {
      console.error("Full error:", error)
      alert("Error creating itinerary: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  const handlePublish = async () => {
    if (!itineraryId) {
      alert("Please create the itinerary first")
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      alert("You must be logged in to publish an itinerary")
      return
    }

    try {
      const response = await fetch(`http://192.168.1.159:8000/api/user/itineraries/${itineraryId}/publish/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to publish itinerary")
      }

      const updatedItinerary = await response.json()
      console.log("Published itinerary:", updatedItinerary)
      
      alert("Itinerary published successfully!")
      window.location.href = "/search" // Redirect to search page
    } catch (error) {
      console.error("Error publishing itinerary:", error)
      alert("Error publishing itinerary: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Itinerary</h1>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="details">Basic Details</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Weekend in Paris"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      placeholder="e.g. Paris, France"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="30"
                      value={duration}
                      onChange={(e) => setDuration(Number.parseInt(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price Range</Label>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant={price === "$" ? "default" : "outline"}
                        onClick={() => setPrice("$")}
                        className="flex-1"
                      >
                        $
                      </Button>
                      <Button
                        type="button"
                        variant={price === "$$" ? "default" : "outline"}
                        onClick={() => setPrice("$$")}
                        className="flex-1"
                      >
                        $$
                      </Button>
                      <Button
                        type="button"
                        variant={price === "$$$" ? "default" : "outline"}
                        onClick={() => setPrice("$$$")}
                        className="flex-1"
                      >
                        $$$
                      </Button>
                    </div>
                  </div>

                  {/* <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Input
                      id="shortDescription"
                      placeholder="A brief summary of your itinerary (max 100 characters)"
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div> */}

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide a detailed description of your itinerary"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="button" onClick={() => setCurrentTab("itinerary")}>
                Next: Add Itinerary Details
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-6">
            {Array.from({ length: duration }).map((_, dayIndex) => {
              const dayNumber = dayIndex + 1
              const dayStops = stops.filter((stop) => stop.day === dayNumber)

              return (
                <Card key={dayNumber}>
                  <CardContent className="pt-6">
                    <h3 className="text-xl font-semibold mb-4">Day {dayNumber}</h3>

                    {dayStops.map((stop) => (
                      <div key={stop.id} className="border rounded-lg p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`stop-name-${stop.id}`}>Name</Label>
                            <Input
                              id={`stop-name-${stop.id}`}
                              placeholder="e.g. Eiffel Tower"
                              value={stop.name}
                              onChange={(e) => updateStop(stop.id, "name", e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`stop-type-${stop.id}`}>Type</Label>
                            <Select value={stop.type} onValueChange={(value) => updateStop(stop.id, "type", value)}>
                              <SelectTrigger id={`stop-type-${stop.id}`}>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="activity">Activity</SelectItem>
                                <SelectItem value="food">Food</SelectItem>
                                <SelectItem value="accommodation">Accommodation</SelectItem>
                                <SelectItem value="transport">Transport</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label>Location</Label>
                            <div className="flex items-center space-x-2">
                              <Input placeholder="Search for a location" className="flex-1" />
                              <Button type="button" variant="outline" size="icon">
                                <MapPin size={16} />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor={`stop-description-${stop.id}`}>Description</Label>
                            <Textarea
                              id={`stop-description-${stop.id}`}
                              placeholder="Describe this stop"
                              value={stop.description}
                              onChange={(e) => updateStop(stop.id, "description", e.target.value)}
                              rows={2}
                            />
                          </div>

                          <div className="flex items-end justify-end">
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeStop(stop.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button type="button" variant="outline" onClick={() => addStop(dayNumber)} className="w-full">
                      <PlusCircle size={16} className="mr-2" />
                      Add Stop
                    </Button>
                  </CardContent>
                </Card>
              )
            })}

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setCurrentTab("details")}>
                Back: Basic Details
              </Button>
              <Button type="button" onClick={() => setCurrentTab("photos")}>
                Next: Add Photos
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="cover-image">Cover Image</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload a cover image that represents your itinerary. This will be the main image shown in listings.
                    </p>
                    <Input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      required
                    />
                    {image && (
                      <div className="mt-2">
                        <img 
                          src={URL.createObjectURL(image)} 
                          alt="Cover preview" 
                          className="max-h-48 rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additional-photos">Additional Photos</Label>
                    <p className="text-sm text-muted-foreground">
                      Add more photos to showcase your itinerary. You can select multiple photos at once.
                    </p>
                    <Input
                      id="additional-photos"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAdditionalPhotosChange}
                      ref={additionalPhotosRef}
                    />
                    {additionalPhotos.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {additionalPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Additional photo ${index + 1}`}
                              className="rounded-lg h-32 w-full object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setAdditionalPhotos(photos => photos.filter((_, i) => i !== index))
                              }}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setCurrentTab("itinerary")}>
                Back: Itinerary Details
              </Button>
              <Button type="button" onClick={() => setCurrentTab("preview")}>
                Next: Preview
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-4">Preview Your Itinerary</h3>

                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Basic Details</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Title:</div>
                      <div>{title || "Not provided"}</div>

                      <div className="text-muted-foreground">Destination:</div>
                      <div>{destination || "Not provided"}</div>

                      <div className="text-muted-foreground">Duration:</div>
                      <div>{duration} days</div>

                      <div className="text-muted-foreground">Price:</div>
                      <div>{price || "Not provided"}</div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm">{description || "No description provided"}</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Itinerary</h4>
                    {stops.length > 0 ? (
                      <div className="space-y-4">
                        {Array.from({ length: duration }).map((_, dayIndex) => {
                          const dayNumber = dayIndex + 1
                          const dayStops = stops.filter((stop) => stop.day === dayNumber)

                          return (
                            <div key={dayNumber} className="space-y-2">
                              <h5 className="font-medium">Day {dayNumber}</h5>
                              {dayStops.length > 0 ? (
                                <ul className="space-y-1 text-sm">
                                  {dayStops.map((stop) => (
                                    <li key={stop.id}>
                                      <span className="font-medium">{stop.name}</span>
                                      {stop.description && ` - ${stop.description}`}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted-foreground">No stops added for this day</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No stops added to your itinerary</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setCurrentTab("photos")}>
                Back: Photos
              </Button>
              <Button type="submit">Publish Itinerary</Button>
            </div>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  )
}

