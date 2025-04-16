"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ChatMessage } from "@/lib/types"
import { Send, Loader2 } from "lucide-react"

export function AIChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi there! I'm your TripTailor assistant. I can help you find the perfect itinerary based on your preferences. Where would you like to go?",
      createdAt: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      let response = ""

      if (input.toLowerCase().includes("paris")) {
        response =
          "Paris is a wonderful destination! I found several itineraries for Paris ranging from weekend trips to week-long stays. Would you prefer a budget-friendly option or a luxury experience?"
      } else if (input.toLowerCase().includes("tokyo")) {
        response =
          "Tokyo is an amazing city to explore! I have itineraries that cover traditional temples, modern attractions, and the best food spots. How many days are you planning to stay?"
      } else if (input.toLowerCase().includes("new york")) {
        response =
          "New York City has so much to offer! I can recommend itineraries that focus on iconic landmarks, museums, or food experiences. What interests you the most?"
      } else {
        response =
          "Thanks for sharing! I can help you find the perfect itinerary. Could you tell me more about your preferences? For example, how long you plan to stay, your budget, and what types of activities you enjoy?"
      }

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: response,
        createdAt: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="font-semibold">TripTailor Assistant</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <Button size="icon" disabled={isLoading || !input.trim()} onClick={handleSend}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

