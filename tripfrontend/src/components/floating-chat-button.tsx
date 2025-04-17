"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { AIChatbot } from "@/components/ai-chatbot"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="fixed bottom-4 right-4 z-50">
        <DialogTrigger asChild>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-lg" aria-label="Open AI Chat Assistant">
            <MessageSquare className="h-6 w-6" />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent className="sm:max-w-md p-0 flex flex-col h-[600px] max-h-[80vh] overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
          <AIChatbot />
        </div>
      </DialogContent>
    </Dialog>
  )
}
