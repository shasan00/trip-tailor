import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 max-w-7xl py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">TripTailor</h3>
            <p className="text-sm text-muted-foreground">
              Making trip planning simple and fun by crowdsourcing curated travel itineraries.
              Sample images from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">unsplash.com</a>
            </p>
          </div>
          <div>
          </div>
          <div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} TripTailor. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

