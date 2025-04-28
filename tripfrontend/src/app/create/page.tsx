"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash2, MapPin, AlertCircle } from "lucide-react"
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'
import { useSession } from "next-auth/react"

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
    address?: string
  }
}

// Define types for Google Maps Autocomplete instance
type AutocompleteInstance = google.maps.places.Autocomplete;

// Libraries needed for Google Maps API
const libraries: ('places' | 'maps')[] = ['places', 'maps'];

// Define types for form validation errors
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

  // --- Add back file input refs --- 
  const fileInputRef = useRef<HTMLInputElement>(null)
  const additionalPhotosRef = useRef<HTMLInputElement>(null)
  // --- End add back file input refs --- 

  // --- Google Maps State and Refs --- 
  const [itineraryLatitude, setItineraryLatitude] = useState<number | null>(null)
  const [itineraryLongitude, setItineraryLongitude] = useState<number | null>(null)
  // Refs to store Autocomplete instances
  const autocompleteRef = useRef<AutocompleteInstance | null>(null);
  const stopAutocompleteRefs = useRef<Record<string, AutocompleteInstance | null>>({});
  // --- End Google Maps State and Refs ---

  // --- Load Google Maps API Script --- 
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
    id: 'google-map-script'
  })
  // --- End Load Google Maps API Script --- 

  // Add validation errors state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { data: session, status } = useSession();

  const addStop = (day: number) => {
    const newStop: Stop = {
      id: `new-${Date.now()}`,
      name: "",
      description: "",
      type: "activity",
      day,
      order: stops.filter((s) => s.day === day).length + 1,
      location: { lat: 0, lng: 0, address: '' },
    }

    setStops([...stops, newStop])
  }

  const updateStop = useCallback((id: string, field: keyof Stop | `location.${keyof Stop['location']}`, value: any) => {
    setStops(prevStops =>
      prevStops.map(stop => {
        if (stop.id === id) {
          if (field.startsWith('location.')) {
            const locField = field.split('.')[1] as keyof Stop['location'];
            return {
              ...stop,
              location: { ...stop.location, [locField]: value },
            };
          } else {
            return { ...stop, [field as keyof Stop]: value };
          }
        }
        return stop;
      })
    );
  }, []);

  const removeStop = (id: string) => {
    if (stopAutocompleteRefs.current[id]) {
      delete stopAutocompleteRefs.current[id];
    }
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

  // --- Autocomplete Handlers --- 
  const handleDestinationLoad = (instance: AutocompleteInstance) => {
    autocompleteRef.current = instance;
  };

  const handleDestinationPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        setItineraryLatitude(place.geometry.location.lat());
        setItineraryLongitude(place.geometry.location.lng());
        setDestination(place.formatted_address || place.name || '');
        console.log('Destination selected:', place.formatted_address);
        console.log('Coordinates:', place.geometry.location.lat(), place.geometry.location.lng());
      } else {
        console.log('No geometry found for selected place');
        setItineraryLatitude(null);
        setItineraryLongitude(null);
      }
    } else {
      console.error('Autocomplete instance is not available.');
    }
  };

  const handleStopLoad = (instance: AutocompleteInstance, stopId: string) => {
    stopAutocompleteRefs.current[stopId] = instance;
  };

  const handleStopPlaceChanged = (stopId: string) => {
    const instance = stopAutocompleteRefs.current[stopId];
    if (instance) {
      const place = instance.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const address = place.formatted_address || place.name || '';
        updateStop(stopId, 'location.lat', lat);
        updateStop(stopId, 'location.lng', lng);
        updateStop(stopId, 'location.address', address);
        console.log(`Stop ${stopId} location:`, address, lat, lng);
      } else {
        console.log(`No geometry found for stop ${stopId}`);
        updateStop(stopId, 'location.lat', 0);
        updateStop(stopId, 'location.lng', 0);
        updateStop(stopId, 'location.address', '');
      }
    } else {
      console.error(`Stop Autocomplete instance ${stopId} is not available.`);
    }
  };
  // --- End Autocomplete Handlers ---

  // Mark a field as touched when it loses focus
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Mark a stop field as touched
  const handleStopBlur = (stopId: string, field: string) => {
    setTouched(prev => ({ ...prev, [`stop_${stopId}_${field}`]: true }));
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};
    
    // Basic field validation
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!destination.trim()) {
      newErrors.destination = 'Destination is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!image) {
      newErrors.image = 'Cover image is required';
    }
    
    if (itineraryLatitude === null || itineraryLongitude === null) {
      newErrors.itineraryCoordinates = 'Please select a valid destination using the search';
    }
    
    // Validate stops - check if each day has at least one valid stop
    const stopErrors: ValidationErrors['stops'] = {};
    const stopsPerDay = Array.from({ length: duration }).map((_, index) => {
      const dayNumber = index + 1;
      return stops.filter(stop => stop.day === dayNumber);
    });
    
    // Check each stop has name and location
    stops.forEach(stop => {
      if (!stop.name.trim()) {
        if (!stopErrors[stop.id]) stopErrors[stop.id] = {};
        stopErrors[stop.id]!.name = 'Stop name is required';
      }
      
      if (stop.location.lat === 0 && stop.location.lng === 0) {
        if (!stopErrors[stop.id]) stopErrors[stop.id] = {};
        stopErrors[stop.id]!.location = 'Please select a valid location';
      }
    });
    
    if (Object.keys(stopErrors).length > 0) {
      newErrors.stops = stopErrors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to find the first tab with errors
  const findTabWithErrors = (errors: ValidationErrors): string => {
    // Check detail tab fields (title, destination, description)
    if (errors.title || errors.destination || errors.description || errors.itineraryCoordinates) {
      return 'details';
    }
    
    // Check itinerary tab fields (stops)
    if (errors.stops && Object.keys(errors.stops).length > 0) {
      return 'itinerary';
    }
    
    // Check photos tab fields (image)
    if (errors.image) {
      return 'photos';
    }
    
    // Default to the current tab if no specific errors found
    return currentTab;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched to show all validation errors
    const allFields = ['title', 'destination', 'description', 'image'];
    const allStopFields = stops.flatMap(stop => 
      [`stop_${stop.id}_name`, `stop_${stop.id}_location`]
    );
    
    const allTouched = [...allFields, ...allStopFields].reduce(
      (acc, field) => ({ ...acc, [field]: true }), {}
    );
    
    setTouched(allTouched);
    
    // Validate all fields before submission
    if (!validateForm()) {
      // Find which tab has errors and navigate to it
      const tabWithErrors = findTabWithErrors(errors);
      if (tabWithErrors !== currentTab) {
        setCurrentTab(tabWithErrors);
        console.log(`Navigating to ${tabWithErrors} tab due to validation errors`);
      }
      
      // After tab navigation and re-render, scroll to the first visible error
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.error-message');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100); // Small timeout to ensure tab switch is completed
      
      return;
    }

    const token = session?.user?.token;
    if (!token) {
      console.error('User not logged in.');
      window.location.href = '/login';
      return;
    }

    try {
      const formData = new FormData()

      // Add basic fields
      formData.append('name', title)
      formData.append('description', description)
      formData.append('duration', duration.toString())
      formData.append('destination', destination) 
      
      if (itineraryLatitude !== null) {
        formData.append('latitude', itineraryLatitude.toFixed(6));
      } 
      if (itineraryLongitude !== null) {
        formData.append('longitude', itineraryLongitude.toFixed(6));
      }
      formData.append('price', (price.length * 100).toString())
      formData.append('status', 'published')

      // Fix: Add null check for image
      if (image) {
        formData.append('image', image)
      }
      // The validateForm() function already checks if image exists before allowing submission

      // Add any additional photos
      if (additionalPhotos.length > 0) {
        // We can't directly append an array of files, so we append them individually
        additionalPhotos.forEach((photo, index) => {
          formData.append(`additional_photo_${index}`, photo);
        });
        // Add a count so the backend knows how many photos to process
        formData.append('additional_photos_count', additionalPhotos.length.toString());
      }

      // Create days array with nested stops
      const daysData = Array.from({ length: duration }).map((_, index) => {
        const dayNumber = index + 1
        const stopsForDay = stops
          .filter(stop => stop.day === dayNumber)
          .map(stop => ({
            name: stop.name,
            description: stop.description,
            stop_type: stop.type,
            latitude: stop.location.lat !== 0 ? stop.location.lat.toFixed(6) : "0.000000",
            longitude: stop.location.lng !== 0 ? stop.location.lng.toFixed(6) : "0.000000",
            location_name: stop.location.address || `Location at ${stop.location.lat}, ${stop.location.lng}`,
            order: stop.order
          }))

        return {
          day_number: dayNumber,
          title: `Day ${dayNumber}`,
          description: '',
          stops: stopsForDay
        }
      })

      // Ensure we send days data even if it's an empty array
      // This triggers our backend to create default days
      formData.append('days', JSON.stringify(daysData))

      console.log('Form data being sent (days stringified):')
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value instanceof File ? value.name : value)
      }
      console.log("Checking formData just before fetch:", formData.get('days'));

      // Fetch Call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/itineraries/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${token}`
        },
        body: formData
      })

      // Response Handling
      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      if (response.status === 401) {
        localStorage.removeItem('token') 
        // Remove alert
        console.error('Session expired. Redirecting to login.');
        window.location.href = "/login"
        return
      }
      
      // Check if response is ok AFTER handling 401
      if (!response.ok) {
          let errorData;
          try {
              errorData = await response.json();
              console.error("Validation errors:", errorData);
              const errorMessages = Object.entries(errorData)
                  .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                  .join('\n');
              throw new Error(`Validation errors:\n${errorMessages}`);
          } catch (e) {
              // If parsing JSON failed, try reading as text
              console.error("Failed to parse error response as JSON:", e);
              const textError = await response.text();
              console.error("Response text:", textError);
              throw new Error(`Server error: ${response.status} - ${textError || 'Failed to create itinerary'}`);
          }
      }

      // --- Change: Redirect on success, remove alert and setItineraryId --- 
      console.log("Itinerary created and published successfully!")
      window.location.href = "/search" // Redirect immediately

    } catch (error) {
      console.error('Full error:', error)
      setErrors(prev => ({ 
        ...prev, 
        general: error instanceof Error ? error.message : 'Unknown error occurred' 
      }));
    }
  }

  // Error message component
  const ErrorMessage = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-1 text-red-500 text-sm mt-1 error-message">
      <AlertCircle size={14} />
      <span>{children}</span>
    </div>
  );

  if (loadError) {
    return <div>Error loading Google Maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Itinerary</h1>

      {/* Display general form error if any */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error:</p>
          <p>{errors.general}</p>
        </div>
      )}

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
                    <Label htmlFor="title" className={errors.title && touched.title ? "text-red-500" : ""}>
                      Title*
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g. Weekend in Paris"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onBlur={() => handleBlur('title')}
                      className={errors.title && touched.title ? "border-red-500 focus-visible:ring-red-500" : ""}
                      required
                    />
                    {errors.title && touched.title && <ErrorMessage>{errors.title}</ErrorMessage>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination" className={errors.destination && touched.destination ? "text-red-500" : ""}>
                      Destination*
                    </Label>
                    <Autocomplete
                      onLoad={handleDestinationLoad}
                      onPlaceChanged={handleDestinationPlaceChanged}
                      options={{ types: ['(cities)'] }}
                      fields={['geometry.location', 'formatted_address', 'name']}
                    >
                      <Input
                        id="destination"
                        placeholder="Search for a destination city"
                        onBlur={() => handleBlur('destination')}
                        className={errors.destination && touched.destination ? "border-red-500 focus-visible:ring-red-500" : ""}
                        required
                      />
                    </Autocomplete>
                    {errors.destination && touched.destination && <ErrorMessage>{errors.destination}</ErrorMessage>}
                    {errors.itineraryCoordinates && touched.destination && <ErrorMessage>{errors.itineraryCoordinates}</ErrorMessage>}
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

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description" className={errors.description && touched.description ? "text-red-500" : ""}>
                      Full Description*
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Provide a detailed description of your itinerary"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => handleBlur('description')}
                      className={errors.description && touched.description ? "border-red-500 focus-visible:ring-red-500" : ""}
                      rows={6}
                      required
                    />
                    {errors.description && touched.description && <ErrorMessage>{errors.description}</ErrorMessage>}
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
                            <Label 
                              htmlFor={`stop-name-${stop.id}`}
                              className={errors.stops?.[stop.id]?.name && touched[`stop_${stop.id}_name`] ? "text-red-500" : ""}
                            >
                              Name*
                            </Label>
                            <Input
                              id={`stop-name-${stop.id}`}
                              placeholder="e.g. Eiffel Tower"
                              value={stop.name}
                              onChange={(e) => updateStop(stop.id, 'name', e.target.value)}
                              onBlur={() => handleStopBlur(stop.id, 'name')}
                              className={errors.stops?.[stop.id]?.name && touched[`stop_${stop.id}_name`] ? "border-red-500 focus-visible:ring-red-500" : ""}
                              required
                            />
                            {errors.stops?.[stop.id]?.name && touched[`stop_${stop.id}_name`] && 
                              <ErrorMessage>{errors.stops[stop.id].name}</ErrorMessage>
                            }
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
                            <Label 
                              htmlFor={`stop-location-${stop.id}`}
                              className={errors.stops?.[stop.id]?.location && touched[`stop_${stop.id}_location`] ? "text-red-500" : ""}
                            >
                              Location*
                            </Label>
                            <Autocomplete
                              onLoad={(instance) => handleStopLoad(instance, stop.id)}
                              onPlaceChanged={() => handleStopPlaceChanged(stop.id)}
                              fields={['geometry.location', 'formatted_address', 'name']}
                            >
                              <Input
                                id={`stop-location-${stop.id}`}
                                placeholder="Search for location (e.g., address, POI)"
                                defaultValue={stop.location.address || ''}
                                onBlur={() => handleStopBlur(stop.id, 'location')}
                                className={errors.stops?.[stop.id]?.location && touched[`stop_${stop.id}_location`] ? "border-red-500 focus-visible:ring-red-500" : ""}
                                required
                              />
                            </Autocomplete>
                            {errors.stops?.[stop.id]?.location && touched[`stop_${stop.id}_location`] && 
                              <ErrorMessage>{errors.stops[stop.id].location}</ErrorMessage>
                            }
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
                    <Label 
                      htmlFor="cover-image"
                      className={errors.image && touched.image ? "text-red-500" : ""}
                    >
                      Cover Image*
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Upload a cover image that represents your itinerary. This will be the main image shown in listings.
                    </p>
                    <Input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      onBlur={() => handleBlur('image')}
                      className={errors.image && touched.image ? "border-red-500 focus-visible:ring-red-500" : ""}
                      ref={fileInputRef}
                      required
                    />
                    {errors.image && touched.image && <ErrorMessage>{errors.image}</ErrorMessage>}
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
              <Button type="submit">Create & Publish Itinerary</Button>
            </div>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  )
}

