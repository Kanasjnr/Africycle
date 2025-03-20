import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-primary/5 border-t">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Image
              src="/Africycle.png"
              alt="AfriCycle Logo"
              width={180}
              height={40}
              className="h-12 w-auto"
            />
            <p className="text-base font-medium text-muted-foreground max-w-xs">
              A blockchain-powered circular economy platform addressing Africa's waste management crisis while creating
              economic opportunities.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-6 w-6" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-6 w-6" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-6 w-6" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">Platform</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Collector App
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Corporate Dashboard
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Impact Tracking
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">Resources</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Whitepaper
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  API
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">Company</h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="text-base font-medium text-muted-foreground hover:text-primary transition-colors">
                  Partners
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-center text-base font-medium text-muted-foreground">
            &copy; {new Date().getFullYear()} AfriCycle. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

