import { getSession } from "next-auth/react";
import type { Itinerary } from "@/lib/types";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "process.env.NEXT_PUBLIC_API_URL";

/**
 * Makes an authenticated API request to the backend
 */
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const session = await getSession();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  // Add the token from the session if available
  if (session?.user?.token) {
    headers["Authorization"] = `Token ${session.user.token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Check for unauthorized status
  if (response.status === 401) {
    // Let Auth.js handle session expiration
    window.location.href = "/api/auth/signout?callbackUrl=/login";
    return null;
  }

  // Check for successful response
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API error: ${response.status}`);
  }

  // Return JSON response for GET requests or response object for others
  if (options.method === undefined || options.method === "GET") {
    return await response.json();
  }
  
  return response;
}

/**
 * Uploads form data to the API with authentication
 */
export async function uploadFormData(endpoint: string, formData: FormData, method = "POST") {
  const session = await getSession();
  
  const headers: Record<string, string> = {};

  // Add the token from the session if available
  if (session?.user?.token) {
    headers["Authorization"] = `Token ${session.user.token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: formData,
  });

  // Check for unauthorized status
  if (response.status === 401) {
    // Let Auth.js handle session expiration
    window.location.href = "/api/auth/signout?callbackUrl=/login";
    return null;
  }

  // Check for successful response
  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const error = await response.json();
      errorMessage = typeof error === "string" 
        ? error 
        : Object.entries(error)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
    } catch (e) {
      errorMessage = `API error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  return response;
} 


export async function getItineraries(): Promise<Itinerary[]> {
  const response = await fetchAPI("/api/itineraries/")
  return response || []
}
