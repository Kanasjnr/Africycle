"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Recycle, Leaf, Coins } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import TypeAnimation with no SSR
const TypeAnimation = dynamic(() => import("react-type-animation").then((mod) => mod.TypeAnimation), { ssr: false })

export default function ImmersiveHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window

      // Normalize mouse position
      const x = clientX / innerWidth
      const y = clientY / innerHeight

      setMousePosition({ x, y })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Calculate positions for floating elements
  const calculatePosition = (baseX, baseY, intensity) => {
    if (!mounted) return { x: baseX, y: baseY }

    return {
      x: baseX + (mousePosition.x - 0.5) * intensity * 100,
      y: baseY + (mousePosition.y - 0.5) * intensity * 100,
    }
  }

  if (!mounted) return null

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-[#1A691A]/30 via-black to-black" />

      {/* Floating elements */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-[#1A691A]/20 blur-3xl"
        animate={calculatePosition(-100, -100, 20)}
        transition={{ type: "spring", damping: 15 }}
      />

      <motion.div
        className="absolute w-96 h-96 rounded-full bg-[#5F9E00]/10 blur-3xl"
        animate={calculatePosition(200, 200, 30)}
        transition={{ type: "spring", damping: 15 }}
      />

      <motion.div
        className="absolute w-48 h-48 rounded-full bg-[#AEE55B]/10 blur-3xl"
        animate={calculatePosition(150, -150, 25)}
        transition={{ type: "spring", damping: 15 }}
      />

      {/* Floating icons */}
      <motion.div
        className="absolute text-[#AEE55B]/30"
        animate={calculatePosition(-200, -100, 40)}
        transition={{ type: "spring", damping: 15 }}
      >
        <Recycle size={80} />
      </motion.div>

      <motion.div
        className="absolute text-[#5F9E00]/30"
        animate={calculatePosition(200, 100, 35)}
        transition={{ type: "spring", damping: 15 }}
      >
        <Leaf size={100} />
      </motion.div>

      <motion.div
        className="absolute text-[#1A691A]/30"
        animate={calculatePosition(100, 200, 45)}
        transition={{ type: "spring", damping: 15 }}
      >
        <Coins size={120} />
      </motion.div>

      {/* Content */}
      <div className="container mx-auto px-6 z-10 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Logo Placeholder */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="mb-6 inline-block"
          >
            <div className="w-20 h-20 rounded-full bg-[#1A691A] mx-auto flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-[#5F9E00] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#AEE55B] flex items-center justify-center text-black font-bold">
                  AC
                </div>
              </div>
            </div>
          </motion.div>

          {/* Title Animation */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            <TypeAnimation
              sequence={[
                "Transforming Waste",
                1000,
                "Creating Wealth",
                1000,
                "Empowering Africa",
                1000,
                "Transforming Waste into Wealth",
                2000,
              ]}
              wrapper="span"
              speed={50}
              repeat={Number.POSITIVE_INFINITY}
              className="bg-gradient-to-r from-white to-[#AEE55B] bg-clip-text text-transparent"
            />
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            AfriCycle is revolutionizing waste management across Africa through blockchain technology, creating economic
            opportunities while solving environmental challenges.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <Button
              size="lg"
              className="bg-[#AEE55B] text-black hover:bg-[#AEE55B]/90 font-medium text-lg px-8 rounded-full group relative overflow-hidden"
            >
              <span className="relative z-10">Start Collecting & Earning</span>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-[#5F9E00] text-[#AEE55B] hover:bg-[#5F9E00]/10 font-medium text-lg px-8 rounded-full group"
            >
              <span>Partner with Us</span>
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

