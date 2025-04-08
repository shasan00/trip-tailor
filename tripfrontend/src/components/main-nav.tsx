"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function MainNav() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)
  // Mock authentication state - in a real app, this would come from an auth provider
  const isAuthenticated = false

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const navItems = [
    { href: "/search", label: "Explore" },
    { href: "/favorites", label: "Favorites" },
    { href: "/create", label: "Create Itinerary" },
  ]

  return (
    <div className="flex justify-between items-center w-full">
      <div className="flex-1">
        <Link href={isAuthenticated ? "/search" : "/"} className="flex items-center space-x-2">
          <span className="font-bold text-xl">TripTailor</span>
        </Link>
      </div>

      {/* Desktop Navigation - Centered */}
      <nav className="hidden md:flex items-center justify-center space-x-6 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href ? "text-primary" : "text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Right side spacer for balance */}
      <div className="flex-1 flex justify-end">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          className="md:hidden"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b z-50">
          <nav className="flex flex-col p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary py-2",
                  pathname === item.href ? "text-primary" : "text-muted-foreground",
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  )
}

