"use client"

import { useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Recycle, Shield, Globe } from "lucide-react"
import { motion } from "framer-motion"

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
    }[] = []

    const createParticles = () => {
      const particleCount = Math.floor(window.innerWidth / 10)

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          color: `rgba(0, 128, 0, ${Math.random() * 0.2 + 0.1})`,
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()

        particle.x += particle.speedX
        particle.y += particle.speedY

        if (particle.x > canvas.width) particle.x = 0
        if (particle.x < 0) particle.x = canvas.width
        if (particle.y > canvas.height) particle.y = 0
        if (particle.y < 0) particle.y = canvas.height
      })

      requestAnimationFrame(animate)
    }

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particles.length = 0
      createParticles()
    }

    createParticles()
    animate()

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <section className="relative pt-20 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" aria-hidden="true" />

      <div className="container relative z-10 mx-auto px-4 py-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              <motion.span
                className="block text-primary"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                AfriCycle:
              </motion.span>
              <motion.span
                className="block"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                Transforming Waste into Opportunity
              </motion.span>
            </h1>
            <motion.p
              className="mt-6 text-xl font-medium text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              A blockchain-powered circular economy platform addressing Africa&apos;s waste management crisis while creating
              economic opportunities through ReFi principles.
            </motion.p>
            <motion.div
              className="mt-8 flex flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <Button size="lg" className="bg-primary hover:bg-primary/90 font-bold text-base">
                Join the Ecosystem <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="font-bold text-base">
                Learn More
              </Button>
            </motion.div>

            <motion.div
              className="mt-12 grid grid-cols-3 gap-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
            >
              <motion.div
                className="flex flex-col items-center text-center p-3 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Recycle className="h-10 w-10 text-primary mb-2" />
                <span className="text-sm font-bold">Multi-Stream Recycling</span>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center p-3 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Shield className="h-10 w-10 text-primary mb-2" />
                <span className="text-sm font-bold">Blockchain Verified</span>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center p-3 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Globe className="h-10 w-10 text-primary mb-2" />
                <span className="text-sm font-bold">Environmental Impact</span>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div
            className="relative lg:pl-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <motion.div
                className="overflow-hidden rounded-2xl shadow-xl"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1470&auto=format&fit=crop"
                  alt="AfriCycle Platform"
                  width={600}
                  height={600}
                  priority
                  className="w-full h-auto object-cover"
                />
              </motion.div>
              <motion.div
                className="absolute -bottom-6 -left-6 rounded-2xl bg-primary/10 backdrop-blur-sm p-6 shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              >
                <div className="flex items-center space-x-4">
                  <motion.div
                    className="rounded-full bg-primary/20 p-3"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  >
                    <Recycle className="h-7 w-7 text-primary" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold">Powered by Celo</p>
                    <p className="text-xs text-muted-foreground">Carbon-negative blockchain</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  )
}

