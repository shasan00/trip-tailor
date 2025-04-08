import { AIChatbot } from "@/components/ai-chatbot"

export default function ChatPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Travel Assistant</h1>
      <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
        Chat with our AI assistant to get personalized itinerary recommendations based on your preferences.
      </p>
      <div className="flex justify-center">
        <AIChatbot />
      </div>
    </div>
  )
}

