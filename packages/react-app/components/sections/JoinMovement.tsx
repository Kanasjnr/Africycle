"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Check } from "lucide-react"

export default function JoinMovement() {
  const [email, setEmail] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const benefits = [
    "Early access to the AfriCycle platform",
    "Exclusive token pre-sale opportunities",
    "Community governance participation",
    "Regular updates on our progress",
    "Invitation to launch events",
  ]

  if (!mounted) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <section id="join" className="relative py-32 overflow-hidden bg-black">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1A691A]/20 to-black" />

      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent" />

      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          initial={{ x: "-50%", y: "-50%" }}
          animate={{
            x: ["-50%", "-30%", "-50%", "-70%", "-50%"],
            y: ["-50%", "-30%", "-70%", "-50%", "-30%"],
          }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 20, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 w-[800px] h-[800px] rounded-full bg-[#1A691A]/10 blur-3xl"
        />
        <motion.div
          initial={{ x: "-50%", y: "-50%" }}
          animate={{
            x: ["-50%", "-70%", "-50%", "-30%", "-50%"],
            y: ["-50%", "-70%", "-30%", "-50%", "-70%"],
          }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 25, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 w-[600px] h-[600px] rounded-full bg-[#5F9E00]/10 blur-3xl"
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-5xl font-bold mb-6 inline-block"
            >
              <span className="bg-gradient-to-r from-white to-[#AEE55B] bg-clip-text text-transparent">
                Join the AfriCycle Movement
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-gray-400 max-w-2xl mx-auto text-lg"
            >
              Be part of the solution to Africa's waste management challenges while creating economic opportunities for
              communities.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Benefits */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <h3 className="text-2xl font-bold text-white mb-8">Why Join Our Community?</h3>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className="flex items-start"
                  >
                    <div className="mt-1 mr-4 w-6 h-6 rounded-full bg-[#5F9E00] flex items-center justify-center flex-shrink-0">
                      <Check className="h-4 w-4 text-black" />
                    </div>
                    <p className="text-gray-300 text-lg">{benefit}</p>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="mt-10 p-6 bg-gradient-to-r from-[#1A691A]/20 to-[#5F9E00]/20 rounded-xl border border-[#AEE55B]/20"
              >
                <h4 className="text-xl font-bold text-[#AEE55B] mb-2">Our Vision</h4>
                <p className="text-gray-300">
                  AfriCycle aims to transform 1 million tons of waste into valuable resources by 2025, while providing
                  sustainable income for 100,000+ waste collectors across Africa.
                </p>
              </motion.div>
            </motion.div>

            {/* Right Column - Sign Up Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-black/40 backdrop-blur-sm border border-[#1A691A]/30 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Stay Updated</h3>
              <p className="text-gray-400 mb-8">
                Sign up to receive updates about our launch, token sales, and partnership opportunities.
              </p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-gray-300 mb-2">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/60 border-[#5F9E00]/30 focus:border-[#AEE55B] text-white"
                  />
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5 mt-1">
                    <input
                      id="terms"
                      type="checkbox"
                      className="w-4 h-4 border border-[#5F9E00] rounded bg-black focus:ring-[#AEE55B] focus:ring-2"
                    />
                  </div>
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-400">
                    I agree to receive updates from AfriCycle. See our{" "}
                    <a href="#" className="text-[#AEE55B] hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>

                <Button className="w-full bg-[#AEE55B] text-black hover:bg-[#AEE55B]/90 font-medium">
                  <span>Join the Movement</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="text-center">
                  <p className="text-gray-500 text-sm">
                    Already a member?{" "}
                    <a href="#" className="text-[#AEE55B] hover:underline">
                      Sign in
                    </a>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

