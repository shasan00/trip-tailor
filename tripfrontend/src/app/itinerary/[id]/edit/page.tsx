"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Calendar, DollarSign, ImageIcon, PlusCircle, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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
      id?: number
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
      description?: string;
    }
  };
  days?: {
    [dayId: string]: {
      title?: string;
      description?: string;
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
  const [stopAutocompleteRefs, setStopAutocompleteRefs] = useState<{ [key: string]: AutocompleteInstance | null }>({});
  const [activeDay, setActiveDay] = useState<number>(1);

  // --- Load Google Maps API Script ---
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
    id: 'google-map-script'
  })

  // Add validation errors state (Keep if needed)
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({}); // Keep if needed for validation

  // Add this function near the top of the component
  const getPriceRange = (price: number): string => {
    if (price <= 500) return "budget";
    if (price <= 1000) return "moderate";
    return "luxury";
  };

  // Add this function near the top of the component
  const setPriceByRange = (range: string): number => {
    switch (range) {
      case "budget": return 250;
      case "moderate": return 750;
      case "luxury": return 1500;
      default: return 250;
    }
  };

  // In the component, add a state to track the price range
  const [priceRange, setPriceRange] = useState<string>("");

  // Add geocoder reference
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  // Add a state to store original days data
  const [originalDays, setOriginalDays] = useState<any[]>([]);

  // Set up geocoder when maps API is loaded
  useEffect(() => {
    if (isLoaded && !geocoder) {
      setGeocoder(new google.maps.Geocoder());
    }
  }, [isLoaded, geocoder]);

  // Add effect to geocode any coordinate-looking locations when itinerary is loaded
  useEffect(() => {
    if (itinerary && geocoder) {
      let needsUpdate = false;
      const updatedItinerary = {...itinerary};
      
      // Function to check if string looks like coordinates
      const isCoordinateString = (str: string) => {
        if (!str) return false;
        
        // Check for various coordinate formats
        // Format: "lat,lng" or "lat, lng"
        const basicFormat = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/;
        
        // Check if it has letters (likely an address, not coordinates)
        const hasLetters = /[a-zA-Z]/.test(str);
        
        // If it matches the basic format and doesn't have letters, it's likely coordinates
        return basicFormat.test(str) && !hasLetters;
      };
      
      // Process each day and activity
      const promises: Promise<void>[] = [];
      
      console.log("Starting geocoding check for all locations");
      
      updatedItinerary.days.forEach((day, dayIndex) => {
        if (day.activities) {
          day.activities.forEach((activity: any, activityIndex: number) => {
            const location = activity.location;
            
            // Check if this looks like coordinates or lacks text (might be coordinates)
            if (location && (isCoordinateString(location) || 
                           (location.includes(',') && location.split(',').length === 2))) {
              
              console.log(`Detected potential coordinates: "${location}" for day ${dayIndex+1}, stop ${activityIndex+1}`);
              
              // Try to extract coordinates regardless of format
              const parts = location.split(',').map((part: string) => part.trim());
              if (parts.length === 2) {
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                
                if (!isNaN(lat) && !isNaN(lng)) {
                  needsUpdate = true;
                  console.log(`Geocoding: ${lat}, ${lng}`);
                  
                  // Create a promise for geocoding
                  const geocodePromise = reverseGeocode(lat, lng).then(address => {
                    console.log(`Geocoded "${location}" to "${address}"`);
                    updatedItinerary.days[dayIndex].activities[activityIndex].location = address;
                  });
                  
                  promises.push(geocodePromise);
                }
              }
            }
          });
        }
      });
      
      // If any coordinates need geocoding, update the itinerary when done
      if (needsUpdate && promises.length > 0) {
        console.log(`Found ${promises.length} locations to geocode`);
        Promise.all(promises).then(() => {
          console.log("Geocoding complete, updating itinerary");
          setItinerary(updatedItinerary);
        }).catch(error => {
          console.error("Error geocoding coordinates:", error);
        });
      } else {
        console.log("No locations needed geocoding");
      }
    }
  }, [itinerary?.id, geocoder, isLoaded]); // Only run when itinerary ID changes or geocoder becomes available

  // Function to reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    if (!geocoder) return `${lat}, ${lng}`;
    
    try {
      const response = await geocoder.geocode({
        location: { lat, lng }
      });
      
      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
    
    return `${lat}, ${lng}`;
  };

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
        if (data.user?.id?.toString() !== session?.user?.id?.toString()) {
          router.push(`/itinerary/${id}`) // Redirect if not owner
          return
        }

        // Transform the data to ensure consistency between "stops" and "activities"
        if (data.days) {
          // Log the data structure to inspect it
          console.log("Itinerary data structure:", JSON.stringify(data.days[0]?.stops?.[0] || {}, null, 2));
          
          // Create an array of promises for reverse geocoding
          const geocodingPromises: Promise<void>[] = [];
          
          data.days.forEach((day: any) => {
            // If the backend returned "stops" instead of "activities", map it
            if (day.stops && !day.activities) {
              day.activities = day.stops.map((stop: any) => {
                // Create a formatted location from latitude/longitude if not present
                let locationStr = "";
                
                if (stop.location) {
                  locationStr = stop.location;
                } else if (stop.address) {
                  locationStr = stop.address;
                } else if (stop.place_name) {
                  locationStr = stop.place_name;
                } else if (stop.latitude && stop.longitude) {
                  // Just use coordinates as placeholder; we'll geocode later
                  locationStr = `${stop.latitude}, ${stop.longitude}`;
                  
                  // If coordinates exist and geocoder is ready, queue up reverse geocoding
                  if (geocoder && !isNaN(parseFloat(stop.latitude)) && !isNaN(parseFloat(stop.longitude))) {
                    const lat = parseFloat(stop.latitude);
                    const lng = parseFloat(stop.longitude);
                    const stopRef = stop; // Keep reference to update it later
                    
                    const geocodePromise = reverseGeocode(lat, lng).then(address => {
                      stopRef._locationAddress = address; // Store in temp property to apply later
                    });
                    
                    geocodingPromises.push(geocodePromise);
                  }
                }
                
                return {
                  id: stop.id,
                  name: stop.name,
                  description: stop.description,
                  type: stop.stop_type || "activity",
                  location: locationStr,
                  _originalStop: stop, // Keep reference to original stop
                  latitude: stop.latitude ? parseFloat(stop.latitude) : undefined,
                  longitude: stop.longitude ? parseFloat(stop.longitude) : undefined
                };
              });
            } else if (!day.activities) {
              day.activities = [];
            }
          });
          
          // Wait for all geocoding to complete, then update locations
          if (geocodingPromises.length > 0) {
            Promise.all(geocodingPromises).then(() => {
              // Now update the itinerary with geocoded addresses
              setItinerary(prevItinerary => {
                if (!prevItinerary) return null;
                
                const updatedItinerary = {...prevItinerary};
                updatedItinerary.days.forEach(day => {
                  day.activities.forEach((activity: any) => {
                    if (activity._originalStop && activity._originalStop._locationAddress) {
                      activity.location = activity._originalStop._locationAddress;
                      delete activity._originalStop;
                    }
                  });
                });
                
                return updatedItinerary;
              });
            });
          }
        }

        setItinerary(data)
        // Store the original days data for restoration if needed
        if (data && data.days) {
          setOriginalDays(JSON.parse(JSON.stringify(data.days)));
        }

        // When itinerary is loaded, set the price range
        if (data) {
          setPriceRange(getPriceRange(data.price));
        }
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

  // --- Google Maps Autocomplete Handlers for Stops ---
  const handleStopLoad = (instance: AutocompleteInstance, dayIndex: number, stopIndex: number) => {
    const key = `${dayIndex}-${stopIndex}`;
    setStopAutocompleteRefs(prev => ({
      ...prev,
      [key]: instance
    }));
  };

  const handleStopSelect = (dayIndex: number, stopIndex: number) => {
    const key = `${dayIndex}-${stopIndex}`;
    const autocomplete = stopAutocompleteRefs[key];
    
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place && place.formatted_address && place.geometry?.location) {
        const roundedLat = Number(place.geometry.location.lat().toFixed(6));
        const roundedLng = Number(place.geometry.location.lng().toFixed(6));

        setItinerary((prev) => {
          if (!prev) return null;
          
          const updatedDays = [...prev.days];
          if (updatedDays[dayIndex] && updatedDays[dayIndex].activities[stopIndex]) {
            updatedDays[dayIndex].activities[stopIndex] = {
              ...updatedDays[dayIndex].activities[stopIndex],
              location: place.formatted_address || updatedDays[dayIndex].activities[stopIndex].location,
              latitude: roundedLat,
              longitude: roundedLng
            };
          }
          
          return {
            ...prev,
            days: updatedDays
          };
        });

        // Clear any validation errors
        setErrors(prev => {
          const updatedErrors = { ...prev };
          if (updatedErrors.stops) {
            delete updatedErrors.stops[`${dayIndex}-${stopIndex}`];
          }
          return updatedErrors;
        });
      }
    }
  };

  // Add a new stop to a day
  const addStop = (dayIndex: number) => {
    setItinerary((prev) => {
      if (!prev) return null;
      
      const updatedDays = [...prev.days];
      // Initialize activities array if it doesn't exist
      if (!updatedDays[dayIndex].activities) {
        updatedDays[dayIndex].activities = [];
      }
      
      updatedDays[dayIndex].activities.push({
        name: "",
        description: "",
        type: "activity", // Default type
        location: "",
      });
      
      return {
        ...prev,
        days: updatedDays
      };
    });
  };

  // Remove a stop from a day
  const removeStop = (dayIndex: number, stopIndex: number) => {
    setItinerary((prev) => {
      if (!prev) return null;
      
      const updatedDays = [...prev.days];
      updatedDays[dayIndex].activities = updatedDays[dayIndex].activities.filter((_, i) => i !== stopIndex);
      
      return {
        ...prev,
        days: updatedDays
      };
    });
  };

  // Update stop field
  const updateStopField = (dayIndex: number, stopIndex: number, field: string, value: string) => {
    setItinerary((prev) => {
      if (!prev) return null;
      
      const updatedDays = [...prev.days];
      updatedDays[dayIndex].activities[stopIndex] = {
        ...updatedDays[dayIndex].activities[stopIndex],
        [field]: value
      };
      
      return {
        ...prev,
        days: updatedDays
      };
    });

    // Clear any validation errors for this field
    setErrors(prev => {
      const updatedErrors = { ...prev };
      if (updatedErrors.stops && updatedErrors.stops[`${dayIndex}-${stopIndex}`]) {
        const stopErrors = updatedErrors.stops[`${dayIndex}-${stopIndex}`];
        if (field in stopErrors) {
          delete (stopErrors as any)[field];
        }
      }
      return updatedErrors;
    });
  };

  // Update day fields
  const updateDayField = (dayIndex: number, field: string, value: string) => {
    setItinerary((prev) => {
      if (!prev) return null;
      
      const updatedDays = [...prev.days];
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        [field]: value
      };
      
      return {
        ...prev,
        days: updatedDays
      };
    });

    // Clear any validation errors for this field
    setErrors(prev => {
      const updatedErrors = { ...prev };
      if (updatedErrors.days && updatedErrors.days[dayIndex]) {
        const dayErrors = updatedErrors.days[dayIndex];
        if (field in dayErrors) {
          delete (dayErrors as any)[field];
        }
      }
      return updatedErrors;
    });
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

    // Validate days and stops
    itinerary.days.forEach((day, dayIndex) => {
      // Validate day title
      if (!day.title.trim()) {
        if (!currentErrors.days) currentErrors.days = {};
        if (!currentErrors.days[dayIndex]) currentErrors.days[dayIndex] = {};
        currentErrors.days[dayIndex].title = "Day title is required.";
        formIsValid = false;
      }
      
      // Validate stops within the day
      day.activities.forEach((stop, stopIndex) => {
        const key = `${dayIndex}-${stopIndex}`;
        
        if (!stop.name.trim()) {
          if (!currentErrors.stops) currentErrors.stops = {};
          if (!currentErrors.stops[key]) currentErrors.stops[key] = {};
          currentErrors.stops[key].name = "Stop name is required.";
          formIsValid = false;
        }
        
        if (!stop.location.trim()) {
          if (!currentErrors.stops) currentErrors.stops = {};
          if (!currentErrors.stops[key]) currentErrors.stops[key] = {};
          currentErrors.stops[key].location = "Stop location is required.";
          formIsValid = false;
        }
      });
    });

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
      if (itinerary.latitude !== undefined && itinerary.latitude !== null && 
          itinerary.longitude !== undefined && itinerary.longitude !== null) {
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

      // Add days and stops data as JSON
      formData.append('days_data', JSON.stringify(itinerary.days));

      // Add debugging to show what's being sent
      console.log("Submitting form data:", {
        name: itinerary.name,
        description: itinerary.description,
        destination: itinerary.destination,
        duration: itinerary.duration,
        price: itinerary.price,
        latitude: itinerary.latitude,
        longitude: itinerary.longitude,
        days_data_length: JSON.stringify(itinerary.days).length,
      });

      // Log a sample of the days data for debugging
      if (itinerary.days.length > 0) {
        console.log("First day sample:", JSON.stringify(itinerary.days[0]));
      }

      // Ensure we're sending properly formatted days data that the backend expects
      // Convert activities to backend format expectation if needed
      const processedDays = itinerary.days.map(day => {
        // Make a deep copy to avoid modifying the original data
        const processedDay = { ...day } as any; // Use 'any' to allow adding stops
        
        // Convert activities for backend compatibility
        if (processedDay.activities) {
          // Backend might expect "stops" instead of "activities"
          processedDay.stops = processedDay.activities.map((activity: {
            id?: number;
            name: string;
            description: string;
            type: string;
            location: string;
            latitude?: number;
            longitude?: number;
          }) => ({
            name: activity.name,
            description: activity.description,
            stop_type: activity.type,
            location: activity.location,
            latitude: activity.latitude?.toString(),
            longitude: activity.longitude?.toString(),
            // Include ID if it exists (for existing stops)
            ...(activity.id ? { id: activity.id } : {})
          }));
        }
        
        return processedDay;
      });

      // Try sending both formats to ensure compatibility with backend
      formData.append('days_json', JSON.stringify(processedDays));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/itineraries/${id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Token ${token}`
          // 'Content-Type': 'multipart/form-data' is set automatically by browser for FormData
        },
        body: formData,
      })
      
      // Log response status for debugging
      console.log("API response status:", response.status);
      
      // Read the response data for analysis
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log("API response data:", responseData);
      } catch (e) {
        console.log("Could not parse response as JSON:", responseText);
      }

      if (!response.ok) {
        if (responseData && typeof responseData === 'object') {
          setErrors(responseData);
        }
        throw new Error(responseData?.detail || "Failed to update itinerary");
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

        {/* Basic Itinerary Info Tab */}
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="days">Days & Stops</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Existing basic info form fields */}
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
                <div className="md:col-span-1">
                  <Label htmlFor="destination">Destination</Label>
                  <Autocomplete
                    onLoad={handleDestinationLoad}
                    onPlaceChanged={handleDestinationSelect}
                  >
                    <Input
                      id="destination"
                      value={itinerary.destination}
                      onChange={(e) => {
                        setItinerary({ ...itinerary, destination: e.target.value });
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
                  <div className="flex items-center">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="rounded-r-none"
                      onClick={() => {
                        const newDuration = Math.max(1, itinerary.duration - 1);
                        // Update itinerary state directly instead of using the input
                        setItinerary(prev => {
                          if (!prev) return null;
                          
                          const updatedDays = [...prev.days].slice(0, newDuration);
                          
                          // Adjust activeDay if it's now out of bounds
                          if (activeDay >= newDuration) {
                            setActiveDay(newDuration - 1);
                          }
                          
                          return {
                            ...prev,
                            duration: newDuration,
                            days: updatedDays
                          };
                        });
                        
                        setTouched(prev => ({...prev, duration: true}));
                      }}
                      aria-label="Decrease duration"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/>
                      </svg>
                    </Button>
                    <Input
                      id="duration"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="rounded-none text-center"
                      value={itinerary.duration}
                      onChange={(e) => {
                        // Parse the input and ensure it's a valid number
                        const value = e.target.value === '' ? 1 : parseInt(e.target.value);
                        const newDuration = isNaN(value) ? 1 : Math.max(1, value);
                        
                        // Update itinerary with new duration and adjust days array
                        setItinerary(prev => {
                          if (!prev) return null;
                          
                          const updatedDays = [...prev.days];
                          const currentDaysCount = updatedDays.length;
                          
                          // Adding days
                          if (newDuration > currentDaysCount) {
                            // Create an array to track days that need geocoding
                            const daysNeedingGeocoding: Array<{dayIndex: number, stopIndex: number, lat: number, lng: number}> = [];
                            
                            for (let i = currentDaysCount + 1; i <= newDuration; i++) {
                              // Check if we have original data for this day
                              const originalDay = originalDays.find(day => day.day_number === i);
                              
                              if (originalDay) {
                                // Use the original day data if available
                                const newDayIndex = updatedDays.length;
                                const clonedDay = JSON.parse(JSON.stringify(originalDay));
                                updatedDays.push(clonedDay);
                                
                                // Check each stop to see if it needs geocoding
                                if (clonedDay.activities) {
                                  clonedDay.activities.forEach((activity: any, stopIndex: number) => {
                                    const needsGeocoding = 
                                      !activity.location || 
                                      (activity.location.includes(',') && 
                                       activity.latitude && 
                                       activity.longitude);
                                       
                                    if (needsGeocoding && activity.latitude && activity.longitude) {
                                      daysNeedingGeocoding.push({
                                        dayIndex: newDayIndex,
                                        stopIndex,
                                        lat: parseFloat(activity.latitude),
                                        lng: parseFloat(activity.longitude)
                                      });
                                    }
                                  });
                                }
                              } else {
                                // Create a new day if no original data exists
                                updatedDays.push({
                                  day_number: i,
                                  title: `Day ${i}`,
                                  description: "",
                                  activities: []
                                });
                              }
                            }
                            
                            // Asynchronously geocode the restored locations if needed
                            if (daysNeedingGeocoding.length > 0 && geocoder) {
                              const daysCopy = [...updatedDays];
                              
                              // Start geocoding in the background
                              Promise.all(
                                daysNeedingGeocoding.map(item => 
                                  reverseGeocode(item.lat, item.lng)
                                    .then(address => {
                                      // Update the days copy with the geocoded address
                                      if (daysCopy[item.dayIndex] && 
                                          daysCopy[item.dayIndex].activities && 
                                          daysCopy[item.dayIndex].activities[item.stopIndex]) {
                                        daysCopy[item.dayIndex].activities[item.stopIndex].location = address;
                                      }
                                    })
                                )
                              ).then(() => {
                                // Update the itinerary state with the geocoded addresses
                                setItinerary(currentItinerary => {
                                  if (!currentItinerary) return null;
                                  return { ...currentItinerary, days: daysCopy };
                                });
                              });
                            }
                          }
                          
                          return {
                            ...prev,
                            duration: newDuration,
                            days: updatedDays
                          };
                        });
                        
                        setTouched(prev => ({...prev, duration: true}));
                      }}
                      required
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="rounded-l-none"
                      onClick={() => {
                        const newDuration = itinerary.duration + 1;
                        // Update itinerary state directly instead of using the input
                        setItinerary(prev => {
                          if (!prev) return null;
                          
                          const updatedDays = [...prev.days];
                          const currentDaysCount = updatedDays.length;
                          
                          // Adding days
                          if (newDuration > currentDaysCount) {
                            // Create an array to track days that need geocoding
                            const daysNeedingGeocoding: Array<{dayIndex: number, stopIndex: number, lat: number, lng: number}> = [];
                            
                            for (let i = currentDaysCount + 1; i <= newDuration; i++) {
                              // Check if we have original data for this day
                              const originalDay = originalDays.find(day => day.day_number === i);
                              
                              if (originalDay) {
                                // Use the original day data if available
                                const newDayIndex = updatedDays.length;
                                const clonedDay = JSON.parse(JSON.stringify(originalDay));
                                updatedDays.push(clonedDay);
                                
                                // Check each stop to see if it needs geocoding
                                if (clonedDay.activities) {
                                  clonedDay.activities.forEach((activity: any, stopIndex: number) => {
                                    const needsGeocoding = 
                                      !activity.location || 
                                      (activity.location.includes(',') && 
                                       activity.latitude && 
                                       activity.longitude);
                                       
                                    if (needsGeocoding && activity.latitude && activity.longitude) {
                                      daysNeedingGeocoding.push({
                                        dayIndex: newDayIndex,
                                        stopIndex,
                                        lat: parseFloat(activity.latitude),
                                        lng: parseFloat(activity.longitude)
                                      });
                                    }
                                  });
                                }
                              } else {
                                // Create a new day if no original data exists
                                updatedDays.push({
                                  day_number: i,
                                  title: `Day ${i}`,
                                  description: "",
                                  activities: []
                                });
                              }
                            }
                            
                            // Asynchronously geocode the restored locations if needed
                            if (daysNeedingGeocoding.length > 0 && geocoder) {
                              const daysCopy = [...updatedDays];
                              
                              // Start geocoding in the background
                              Promise.all(
                                daysNeedingGeocoding.map(item => 
                                  reverseGeocode(item.lat, item.lng)
                                    .then(address => {
                                      // Update the days copy with the geocoded address
                                      if (daysCopy[item.dayIndex] && 
                                          daysCopy[item.dayIndex].activities && 
                                          daysCopy[item.dayIndex].activities[item.stopIndex]) {
                                        daysCopy[item.dayIndex].activities[item.stopIndex].location = address;
                                      }
                                    })
                                )
                              ).then(() => {
                                // Update the itinerary state with the geocoded addresses
                                setItinerary(currentItinerary => {
                                  if (!currentItinerary) return null;
                                  return { ...currentItinerary, days: daysCopy };
                                });
                              });
                            }
                          }
                          
                          return {
                            ...prev,
                            duration: newDuration,
                            days: updatedDays
                          };
                        });
                        
                        setTouched(prev => ({...prev, duration: true}));
                      }}
                      aria-label="Increase duration"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/>
                        <path d="M12 5v14"/>
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* Price Range Selection */}
                <div>
                  <Label>Price Range</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={priceRange === "budget" ? "default" : "outline"}
                      onClick={() => {
                        setPriceRange("budget");
                        setItinerary(prev => {
                          if (!prev) return null;
                          return { ...prev, price: setPriceByRange("budget") };
                        });
                      }}
                    >
                      $
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={priceRange === "moderate" ? "default" : "outline"}
                      onClick={() => {
                        setPriceRange("moderate");
                        setItinerary(prev => {
                          if (!prev) return null;
                          return { ...prev, price: setPriceByRange("moderate") };
                        });
                      }}
                    >
                      $$
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={priceRange === "luxury" ? "default" : "outline"}
                      onClick={() => {
                        setPriceRange("luxury");
                        setItinerary(prev => {
                          if (!prev) return null;
                          return { ...prev, price: setPriceByRange("luxury") };
                        });
                      }}
                    >
                      $$$
                    </Button>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label>Cover Image</Label>
                <div className="flex flex-col items-center space-y-4 mt-2">
                  <div className="relative h-48 w-64">
                    <img
                      src={image 
                        ? URL.createObjectURL(image) 
                        : (itinerary.image 
                           ? (itinerary.image.startsWith('http') 
                              ? itinerary.image 
                              : `${process.env.NEXT_PUBLIC_API_URL}${itinerary.image}`) 
                           : '/placeholder.png')}
                      alt="Cover"
                      className="h-full w-full rounded-lg object-cover"
                      onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
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
          </TabsContent>
          
          <TabsContent value="days" className="mt-4">
            <div className="space-y-6">
              {/* Day Selector */}
              <div>
                <Label htmlFor="day-selector">Select Day</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {itinerary.days.map((day, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant={activeDay === index ? "default" : "outline"}
                      onClick={() => setActiveDay(index)}
                    >
                      Day {day.day_number}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Active Day Editor */}
              {itinerary.days[activeDay] && (
                <div className="space-y-4 border p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Day {itinerary.days[activeDay].day_number}</h3>
                  </div>
                  
                  {/* Day Title */}
                  <div>
                    <Label htmlFor={`day-${activeDay}-title`}>Day Title</Label>
                    <Input
                      id={`day-${activeDay}-title`}
                      value={itinerary.days[activeDay].title}
                      onChange={(e) => updateDayField(activeDay, 'title', e.target.value)}
                      required
                      aria-invalid={!!(errors.days?.[activeDay]?.title)}
                    />
                    {errors.days?.[activeDay]?.title && (
                      <p className="text-sm text-red-600 mt-1">{errors.days[activeDay].title}</p>
                    )}
                  </div>
                  
                  {/* Stops for this day */}
                  <div className="space-y-4 mt-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Stops</h4>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addStop(activeDay)}
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Stop
                      </Button>
                    </div>
                    
                    {/* Stop Cards */}
                    <div className="space-y-4">
                      {itinerary.days[activeDay].activities && itinerary.days[activeDay].activities.length > 0 ? (
                        itinerary.days[activeDay].activities.map((stop, stopIndex) => (
                          <Card key={stopIndex} className="relative">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2"
                              onClick={() => removeStop(activeDay, stopIndex)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">Stop {stopIndex + 1}</CardTitle>
                            </CardHeader>
                            
                            <CardContent className="space-y-3">
                              {/* Stop Name */}
                              <div>
                                <Label htmlFor={`stop-${activeDay}-${stopIndex}-name`}>Name</Label>
                                <Input
                                  id={`stop-${activeDay}-${stopIndex}-name`}
                                  value={stop.name}
                                  onChange={(e) => updateStopField(activeDay, stopIndex, 'name', e.target.value)}
                                  required
                                  aria-invalid={!!(errors.stops?.[`${activeDay}-${stopIndex}`]?.name)}
                                />
                                {errors.stops?.[`${activeDay}-${stopIndex}`]?.name && (
                                  <p className="text-sm text-red-600 mt-1">{errors.stops[`${activeDay}-${stopIndex}`].name}</p>
                                )}
                              </div>
                              
                              {/* Stop Type */}
                              <div>
                                <Label htmlFor={`stop-${activeDay}-${stopIndex}-type`}>Type</Label>
                                <Select
                                  value={stop.type}
                                  onValueChange={(value) => updateStopField(activeDay, stopIndex, 'type', value)}
                                >
                                  <SelectTrigger id={`stop-${activeDay}-${stopIndex}-type`}>
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
                              
                              {/* Stop Location */}
                              <div>
                                <Label htmlFor={`stop-${activeDay}-${stopIndex}-location`}>Location</Label>
                                <Autocomplete
                                  onLoad={(autocomplete) => handleStopLoad(autocomplete, activeDay, stopIndex)}
                                  onPlaceChanged={() => handleStopSelect(activeDay, stopIndex)}
                                >
                                  <Input
                                    id={`stop-${activeDay}-${stopIndex}-location`}
                                    value={stop.location}
                                    onChange={(e) => updateStopField(activeDay, stopIndex, 'location', e.target.value)}
                                    placeholder="Enter location"
                                    required
                                    aria-invalid={!!(errors.stops?.[`${activeDay}-${stopIndex}`]?.location)}
                                  />
                                </Autocomplete>
                                {errors.stops?.[`${activeDay}-${stopIndex}`]?.location && (
                                  <p className="text-sm text-red-600 mt-1">{errors.stops[`${activeDay}-${stopIndex}`].location}</p>
                                )}
                              </div>
                              
                              {/* Stop Description */}
                              <div>
                                <Label htmlFor={`stop-${activeDay}-${stopIndex}-description`}>Description</Label>
                                <Textarea
                                  id={`stop-${activeDay}-${stopIndex}-description`}
                                  value={stop.description}
                                  onChange={(e) => updateStopField(activeDay, stopIndex, 'description', e.target.value)}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 border border-dashed rounded-lg">
                          <p className="text-muted-foreground">No stops added yet.</p>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => addStop(activeDay)}
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add First Stop
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

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
