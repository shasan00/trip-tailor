"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Calendar, DollarSign, ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
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

export default function EditItineraryPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params.id as string
  const [itinerary, setItinerary] = useState<Itinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchItinerary = async () => {
      try {
        const token = session?.user?.token;

        if (!token) {
          router.push('/login')
          return
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/itineraries/${id}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        })
        if (!response.ok) {
          throw new Error("Failed to fetch itinerary")
        }
        const data = await response.json()
        
        // Check if the current user is the creator
        if (data.user?.id?.toString() !== session?.user?.id) {
          router.push(`/itinerary/${id}`)
          return
        }
        
        setItinerary(data)
      } catch (err) {
        console.error("Error fetching itinerary:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (status == "authenticated") {
        fetchItinerary();
    }
  }, [id, router, session, status])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itinerary) return

    setSaving(true)
    try {
      const token = session?.user?.token
      if (!token) {
        throw new Error("You must be logged in to edit an itinerary")
      }

      const formData = new FormData()
      
      // Add basic fields
      formData.append('name', itinerary.name)
      formData.append('description', itinerary.description)
      formData.append('destination', itinerary.destination)
      formData.append('duration', itinerary.duration.toString())
      formData.append('price', itinerary.price.toString())

      // Add image if a new one was selected
      if (image) {
        formData.append('image', image)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/itineraries/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to update itinerary")
      }

      toast({
        title: "Success",
        description: "Itinerary updated successfully!",
      })

      router.push(`/itinerary/${id}`)
    } catch (err) {
      console.error("Error updating itinerary:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setSaving(false)
    }
  }

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
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-8">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={itinerary.name}
              onChange={(e) => setItinerary({ ...itinerary, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={itinerary.description}
              onChange={(e) => setItinerary({ ...itinerary, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                value={itinerary.destination}
                onChange={(e) => setItinerary({ ...itinerary, destination: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={itinerary.duration}
                onChange={(e) => setItinerary({ ...itinerary, duration: parseInt(e.target.value) })}
                required
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={itinerary.price}
                onChange={(e) => setItinerary({ ...itinerary, price: parseInt(e.target.value) })}
                required
                min="0"
              />
            </div>
          </div>

          <div>
            <Label>Cover Image</Label>
            <div className="mt-2 flex items-center space-x-4">
              <div className="relative h-32 w-32">
                <img
                  src={image ? URL.createObjectURL(image) : `${process.env.NEXT_PUBLIC_API_URL}${itinerary.image}`}
                  alt="Cover"
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Change Image
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
} 
