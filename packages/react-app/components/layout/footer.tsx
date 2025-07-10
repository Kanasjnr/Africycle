import Link from "next/link"
import Image from "next/image"
import {  Twitter, Github, Send } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-primary/5 border-t">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-8 md:space-y-0">
          <div className="flex items-center space-x-8">
            <Image
              src="/Africycle.png"
              alt="AfriCycle Logo"
              width={180}
              height={48}
              className="h-14 w-auto"
            />
            <p className="text-lg text-muted-foreground font-medium">
              &copy; {new Date().getFullYear()} AfriCycle. All rights reserved.
            </p>
          </div>

          <div className="flex items-center space-x-10">
            <Link href="https://docs.google.com/document/d/1Np5ef2_3wkdKblfs8z3pMGYNrAMkb_MYmV_yx_Q-nVI/edit?usp=sharing" target="_blank" rel="noopener noreferrer" className="text-lg text-muted-foreground hover:text-primary transition-colors font-medium">
              Documentation
            </Link>
            <Link href="https://africycle.hashnode.space/default-guide/africycle" target="_blank" rel="noopener noreferrer" className="text-lg text-muted-foreground hover:text-primary transition-colors font-medium">
              Whitepaper
            </Link>
            <Link href="mailto:info@africycle.xyz" className="text-lg text-muted-foreground hover:text-primary transition-colors font-medium">
              Contact
            </Link>
          </div>

          <div className="flex space-x-6">
            <Link href="https://x.com/africycle" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Twitter className="h-8 w-8" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="https://github.com/Kanasjnr/Africycle" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="h-8 w-8" />
              <span className="sr-only">GitHub</span>
            </Link>
            <Link href="https://t.me/+aCZcunVKdkw2NDc0" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
              <Send className="h-8 w-8" />
              <span className="sr-only">Telegram</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

