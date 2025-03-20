"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export default function ProcessFlow() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const steps = [
    {
      title: "Collection",
      description: "Waste collectors gather plastic, e-waste, and metals from communities and businesses.",
      icon: "📱",
      color: "#1A691A",
    },
    {
      title: "Verification",
      description: "Collected waste is verified through our blockchain-powered app with photo evidence.",
      icon: "✅",
      color: "#4C862D",
    },
    {
      title: "Tokenization",
      description: "Verified waste is tokenized, and collectors receive immediate cryptocurrency payments.",
      icon: "💰",
      color: "#5F9E00",
    },
    {
      title: "Processing",
      description: "Waste is transported to recycling facilities for processing into new materials.",
      icon: "♻️",
      color: "#8BC34A",
    },
    {
      title: "Marketplace",
      description: "Recycled materials and carbon credits are sold on our digital marketplace.",
      icon: "🛒",
      color: "#AEE55B",
    },
  ]

  if (!mounted) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <section id="process" className="relative py-32 overflow-hidden bg-black">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1A691A]/10 to-black" />

      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-6 inline-block"
          >
            <span className="bg-gradient-to-r from-white to-[#AEE55B] bg-clip-text text-transparent">
              How AfriCycle Works
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Our blockchain-powered platform creates a seamless process from waste collection to recycling and
            monetization.
          </motion.p>
        </div>

        <div className="relative">
          {/* Process Flow Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#1A691A] to-[#AEE55B] transform -translate-x-1/2 hidden md:block" />

          {/* Process Steps */}
          <div className="space-y-24 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 + index * 0.2 }}
                className={`flex flex-col ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } items-center gap-8 md:gap-16`}
              >
                {/* Step Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                  <h3 className="text-3xl font-bold text-white mb-4 flex items-center md:block">
                    <span
                      className="md:hidden w-10 h-10 rounded-full flex items-center justify-center mr-3 text-xl"
                      style={{ backgroundColor: step.color }}
                    >
                      {index + 1}
                    </span>
                    <span className="bg-gradient-to-r from-white to-[#AEE55B] bg-clip-text text-transparent">
                      {step.title}
                    </span>
                  </h3>
                  <p className="text-gray-300 text-lg">{step.description}</p>
                </div>

                {/* Step Icon - Mobile */}
                <div className="md:hidden w-16 h-16 rounded-full flex items-center justify-center text-3xl">
                  {step.icon}
                </div>

                {/* Step Icon - Desktop */}
                <div className="hidden md:flex relative">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center text-5xl z-10 bg-black"
                    style={{ boxShadow: `0 0 30px ${step.color}` }}
                  >
                    {step.icon}
                  </motion.div>
                  <div
                    className="absolute w-32 h-32 rounded-full opacity-20 blur-xl"
                    style={{ backgroundColor: step.color, top: "-16px", left: "-16px" }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full"
                    style={{ backgroundColor: step.color }}
                  />
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="mt-24 text-center"
          >
            <div className="inline-block p-6 bg-gradient-to-r from-[#1A691A]/30 to-[#5F9E00]/30 rounded-xl border border-[#AEE55B]/20">
              <h4 className="text-xl font-bold text-[#AEE55B] mb-4">Ready to Join the Circular Economy?</h4>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Whether you're a waste collector, recycling facility, or corporate partner, AfriCycle has a place for
                you in our ecosystem.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-[#AEE55B] text-black rounded-full font-medium inline-flex items-center"
              >
                <span>Get Started Today</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

