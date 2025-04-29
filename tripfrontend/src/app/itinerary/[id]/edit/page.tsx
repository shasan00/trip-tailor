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
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'

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
    username:
    string
    first_name: string
    last_name: string
    id?: number | string;
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

      latitude?: number;
      longitude?: number;
    }>
  }>
  latitude?: number | null;
  longitude?: number | null;
}


type AutocompleteInstance = google.maps.places.Autocomplete;


const libraries: ('places' | 'maps')[] = ['places', 'maps'];


interface ValidationErrors {
  title?: string;
  destination?: string;
  description?: string;
  image?: string;
  itineraryCoordinates?: string; 
  stops?: {
    [stopId: string]: {
      name?: string;
      location?: string;
    }
  };
  general?: string; // For general form errors
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

  const autocompleteRef = useRef<AutocompleteInstance | null>(null);

  // --- Load Google Maps API Script ---
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
    id: 'google-map-script'
  })

  // Add validation errors state (Keep if needed)
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({}); // Keep if needed for validation

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
			if (data.user?.id?.toString() !== session?.user?.id?.toString()) { // Ensure IDs are compared correctly
          router.push(`/itinerary/${id}`) // Redirect if not owner
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

    if (status === "authenticated") {
        fetchItinerary();
	} else if (status === "unauthenticated") {
        router.push('/login'); // Redirect if not logged in
    }
  }, [id, router, session, status])

  // --- Google Maps Autocomplete Handlers ---

  // Store the autocomplete instance when it loads
  const handleDestinationLoad = (instance: AutocompleteInstance) => {
    autocompleteRef.current = instance;
	}; // Moved outside handleSubmit

  // Handle place selection from Autocomplete
  const handleDestinationSelect = () => {
    if (autocompleteRef.current) {
    const place = autocompleteRef.current.getPlace();
    if (place && place.formatted_address && place.geometry?.location) {
      const roundedLat = Number(place.geometry.location.lat().toFixed(6)); // Round to 6 decimals
      const roundedLng = Number(place.geometry.location.lng().toFixed(6)); // Round to 6 decimals

      setItinerary((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          destination: place.formatted_address || prev.destination,
          latitude: roundedLat,
          longitude: roundedLng,
        };
      });

      setErrors(prev => ({ ...prev, destination: undefined }));
      setTouched(prev => ({ ...prev, destination: true }));
    } else {
      console.warn("Autocomplete place details incomplete:", place);
    }
  }
};

  // --- End Google Maps Autocomplete Handlers ---

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
      // Clear potential image validation error
      setErrors(prev => ({...prev, image: undefined}));
      setTouched(prev => ({...prev, image: true})); // Mark as touched if using validation
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itinerary || !isLoaded) return // Don't submit if itinerary or maps not loaded

    setSaving(true);
    setError(null); // Clear previous errors
    setErrors({}); // Clear validation errors

    // Basic Validation (Add more as needed)
    let formIsValid = true;
    const currentErrors: ValidationErrors = {};
    if (!itinerary.name.trim()) {
        currentErrors.title = "Name is required.";
        formIsValid = false;
    }
    if (!itinerary.description.trim()) {
        currentErrors.description = "Description is required.";
        formIsValid = false;
    }
    if (!itinerary.destination.trim()) {
        currentErrors.destination = "Destination is required.";
        formIsValid = false;
    }
    // Optionally validate coordinates
	if (itinerary.latitude === null || itinerary.longitude === null) {
		 currentErrors.itineraryCoordinates = "Please select a valid destination from the suggestions.";
		formIsValid = false;
	}

    if (!formIsValid) {
        setErrors(currentErrors);
        setSaving(false);
        toast({
            title: "Validation Error",
            description: "Please fix the errors in the form.",
            variant: "destructive",
        });
        return;
    }


    try {
      const token = session?.user?.token
      if (!token) {
        throw new Error("You must be logged in to edit an itinerary")
		}

      const formData = new FormData()

      // Add fields to form data
      formData.append('name', itinerary.name)
      formData.append('description', itinerary.description)
      formData.append('destination', itinerary.destination)
      formData.append('duration', itinerary.duration.toString())
      formData.append('price', itinerary.price.toString())
      // Append coordinates if your backend expects them
      if (itinerary.latitude !== null && itinerary.longitude !== null) {
          formData.append('latitude', itinerary.latitude.toString());
          formData.append('longitude', itinerary.longitude.toString());
      }

      // Add image if a new one was selected
      if (image) {
        formData.append('image', image)
      }
      // else if (!itinerary.image) { // Optional: Validate if an image is required
      //   currentErrors.image = "Cover image is required.";
      //   formIsValid = false;
      // }


      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/itineraries/${id}/`, {
        method: 'PUT',
		headers: {
          'Authorization': `Token ${token}`
          // 'Content-Type': 'multipart/form-data' is set automatically by browser for FormData
        },
        body: formData,
      })

      if (!response.ok) {
		  const errorData = await response.json();
		  console.error("Error Response From Server:", errorData); // 👈 Add this line!
		  if (errorData && typeof errorData === 'object') {
			setErrors(errorData);
		  }
		  throw new Error(errorData.detail || "Failed to update itinerary");
		}

      toast({
        title: "Success",
        description: "Itinerary updated successfully!",
      })

      router.push(`/itinerary/${id}`) // Redirect on success
    } catch (err) {
      console.error("Error updating itinerary:", err)
      // Set general error or specific field errors if possible
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message); // Show general error message
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // --- Render Logic ---

  if (loadError) {
      return <div className="container py-16 text-center text-red-600">Error loading Google Maps. Please check your API key and network connection.</div>;
  }

  if (loading || !isLoaded) { // Show loading while itinerary or maps are loading
    return (
      <div className="container py-16 text-center">
        <p className="text-lg">Loading...</p>
      </div>
    )
  }

  // Itinerary fetch error or user mismatch error
  if (error && !itinerary) { // Check if error occurred *before* itinerary was loaded
    return (
      <div className="container py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="text-muted-foreground mb-8">{error}</p>
        <Button onClick={() => router.push('/')}>Go Home</Button> {/* Redirect home on critical fetch error */}
      </div>
    )
  }

  // Itinerary loaded, proceed with form rendering
  if (!itinerary) {
     // This case should ideally not be reached if loading/error states are handled correctly
     return <div className="container py-16 text-center">Itinerary data not available.</div>;
  }


  // Main Form Render
  return (
	<div className="container py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Display general form submission error */}
        {error && <p className="text-red-600 text-center">{error}</p>}

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={itinerary.name}
              onChange={(e) => {
                setItinerary({ ...itinerary, name: e.target.value });
                setErrors(prev => ({...prev, title: undefined})); // Clear error on change
                setTouched(prev => ({...prev, name: true}));
              }}
              required
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "name-error" : undefined}
            />
             {errors.title && <p id="name-error" className="text-sm text-red-600 mt-1">{errors.title}</p>}
          </div>

          {/* Description Textarea */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={itinerary.description}
              onChange={(e) => {
                setItinerary({ ...itinerary, description: e.target.value });
                setErrors(prev => ({...prev, description: undefined})); // Clear error on change
                setTouched(prev => ({...prev, description: true}));
              }}
              required
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {errors.description && <p id="description-error" className="text-sm text-red-600 mt-1">{errors.description}</p>}
          </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Destination Autocomplete Input */}
            <div className="md:col-span-1"> {/* Adjust span as needed */}
              <Label htmlFor="destination">Destination</Label>
               {/* Wrap Input with Autocomplete */}
               <Autocomplete
                 onLoad={handleDestinationLoad}
                 onPlaceChanged={handleDestinationSelect}
                 // Optional: Add restrictions (e.g., to countries or types)
                 // options={{ types: ['(cities)'] }}
               >
                 <Input
                    id="destination"
                    value={itinerary.destination} // Controlled by state
                    onChange={(e) => {
                        // Allow typing, but selection updates the state fully via handleDestinationSelect
                        setItinerary({ ...itinerary, destination: e.target.value });
                        // Clear coordinate errors if user types manually, but require selection
                        // setItinerary(prev => ({...prev!, latitude: null, longitude: null}));
                        setErrors(prev => ({...prev, destination: undefined, itineraryCoordinates: undefined}));
                        setTouched(prev => ({...prev, destination: true}));
                     }}
                    placeholder="Enter destination"
                    required
                    aria-invalid={!!errors.destination || !!errors.itineraryCoordinates}
                    aria-describedby={errors.destination ? "destination-error" : errors.itineraryCoordinates ? "coordinates-error" : undefined}
                 />
              </Autocomplete>
              {errors.destination && <p id="destination-error" className="text-sm text-red-600 mt-1">{errors.destination}</p>}
              {errors.itineraryCoordinates && <p id="coordinates-error" className="text-sm text-red-600 mt-1">{errors.itineraryCoordinates}</p>}
            </div>

            {/* Duration Input */}
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
				id="duration"
                type="number"
                value={itinerary.duration}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setItinerary({ ...itinerary, duration: isNaN(value) ? 0 : value }); // Handle NaN
                  setTouched(prev => ({...prev, duration: true}));
                }}
                required
                min="1"
				/>
               {/* Add validation message if needed */}
            </div>

            {/* Price Input */}
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
			    value={itinerary.price}
                 onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setItinerary({ ...itinerary, price: isNaN(value) ? 0 : value }); // Handle NaN
                  setTouched(prev => ({...prev, price: true}));
                 }}
                required
                min="0"
                step="0.01" // Optional: Allow decimals
              />
              {/* Add validation message if needed */}
            </div>
          </div>

          {/* Image Upload */}
			<div>
            <Label>Cover Image</Label>
            <div className="mt-2 flex items-center space-x-4">
              <div className="relative h-32 w-32">
                 {/* Display existing or preview image */}
                 <img
                    src={image ? URL.createObjectURL(image) : (itinerary.image ? `${process.env.NEXT_PUBLIC_API_URL}${itinerary.image}` : '/placeholder.png')} // Added fallback placeholder
                    alt="Cover"
                    className="h-full w-full rounded-lg object-cover"
                    onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} // Handle image load error
                 />
              </div>
              <div>
			  <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*" // Specify accepted image types
                  className="hidden"
				/>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Change cover image"
                >
					<ImageIcon className="mr-2 h-4 w-4" />
                  {image ? "Change Image" : (itinerary.image ? "Change Image" : "Upload Image")}
                </Button>
              </div>
            </div>
             {errors.image && <p className="text-sm text-red-600 mt-1">{errors.image}</p>}
          </div>
        </div>

        {/* Action Buttons */}
		<div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()} // Go back to previous page
            disabled={saving}
          >
            Cancel
          </Button>
			<Button type="submit" disabled={saving || !isLoaded}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  )
}
