"use client"

import type React from "react"

import { useState } from "react"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the itinerary to the server
    alert("Itinerary created successfully!")
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
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Upload Photos</h3>
                  <p className="text-muted-foreground">
                    Add photos to showcase your itinerary. You can upload up to 10 photos.
                  </p>

                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
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
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                          <line x1="16" x2="22" y1="5" y2="5" />
                          <line x1="19" x2="19" y1="2" y2="8" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium">Drag and drop your photos here, or click to browse</p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: JPG, PNG, WEBP. Max file size: 5MB.
                      </p>
                      <Button type="button" variant="outline" size="sm">
                        Browse Files
                      </Button>
                    </div>
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

