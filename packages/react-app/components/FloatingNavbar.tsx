"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ChevronDown } from "lucide-react"

export default function FloatingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const [mounted, setMounted] = useState(false)

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Impact", href: "#impact" },
    { name: "Process", href: "#process" },
    { name: "Ecosystem", href: "#ecosystem" },
    { name: "Join", href: "#join" },
  ]

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)

      // Determine active section
      const sections = navLinks.map((link) => link.href.substring(1))
      const scrollPosition = window.scrollY + 100

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i])
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i])
          break
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [navLinks])

  const scrollToSection = (href) => {
    setIsMenuOpen(false)
    const element = document.querySelector(href)
    if (element) {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - 100,
        behavior: "smooth",
      })
    }
  }

  // Don't render anything during SSR
  if (!mounted) return null

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          backgroundColor: isScrolled ? "rgba(0, 0, 0, 0.8)" : "transparent",
          backdropFilter: isScrolled ? "blur(10px)" : "blur(0px)",
        }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
            <div className="w-10 h-10 rounded-full bg-[#1A691A] flex items-center justify-center mr-3">
              <div className="w-6 h-6 rounded-full bg-[#AEE55B] flex items-center justify-center text-black font-bold text-xs">
                AC
              </div>
            </div>
            <span className="text-xl font-bold text-[#AEE55B]">AfriCycle</span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <motion.button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors relative ${
                  activeSection === link.href.substring(1) ? "text-[#AEE55B]" : "text-gray-300 hover:text-white"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {link.name}
                {activeSection === link.href.substring(1) && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#AEE55B]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex items-center px-4 py-2 bg-[#AEE55B] text-black rounded-full font-medium text-sm"
          >
            Connect Wallet
          </motion.button>

          {/* Mobile Menu Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white z-20 w-10 h-10 flex items-center justify-center bg-[#1A691A] rounded-full"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-lg z-40 flex flex-col items-center justify-center md:hidden"
          >
            <div className="flex flex-col items-center space-y-6 w-full px-12">
              {navLinks.map((link, index) => (
                <motion.button
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => scrollToSection(link.href)}
                  className={`text-2xl font-medium w-full py-3 border-b border-gray-800 ${
                    activeSection === link.href.substring(1) ? "text-[#AEE55B]" : "text-gray-300"
                  }`}
                >
                  {link.name}
                </motion.button>
              ))}

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: navLinks.length * 0.1 }}
                className="mt-8 w-full py-3 bg-[#AEE55B] text-black rounded-full font-medium"
              >
                Connect Wallet
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Indicator */}
      <motion.div
        className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-40 hidden md:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: isScrolled ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
          className="flex flex-col items-center"
        >
          <ChevronDown className="text-[#AEE55B] h-6 w-6" />
          <span className="text-xs text-gray-400">Scroll</span>
        </motion.div>
      </motion.div>
    </>
  )
}

