export interface User {
    id: string
    name: string
    email: string
    image?: string
  }
  
  export interface Itinerary {
    id: string
    title: string
    destination: string
    description: string
    shortDescription: string
    duration: number
    price: number
    rating: number
    reviewCount: number
    image: string
    createdBy: User
    createdAt: string
    stops: Stop[]
    reviews: Review[]
  }
  
  export interface Stop {
    id: string
    name: string
    description: string
    type: "activity" | "food" | "accommodation" | "transport"
    location: {
      lat: number
      lng: number
    }
    day: number
    order: number
  }
  
  export interface Review {
    id: string
    rating: number
    comment: string
    user: User
    createdAt: string
  }
  
  export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    createdAt: string
  }
  
  