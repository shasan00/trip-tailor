"use client"

import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"
import { useAuth } from "@/lib/auth-context"

export function Header() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl flex h-16 items-center justify-between">
        <MainNav />
        <div className="flex items-center space-x-4">
          {!isAuthenticated && (
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          )}
          <UserNav />
        </div>
      </div>
    </header>
  )
}

