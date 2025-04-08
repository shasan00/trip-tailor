import type React from "react"
import { Inter } from "next/font/google"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { FloatingChatButton } from "@/components/floating-chat-button"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "TripTailor - Crowdsourced Travel Itineraries",
  description: "Plan your perfect trip with curated itineraries from locals and travelers.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 max-w-7xl">{children}</main>
            <Footer />
            <FloatingChatButton />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

