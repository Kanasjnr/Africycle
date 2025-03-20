"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, Coins, Users, Recycle, ArrowRight } from "lucide-react"

export default function ImpactSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const problems = [
    {
      icon: <Trash2 className="h-10 w-10" />,
      title: "Environmental Crisis",
      description: "Africa generates 17 million tons of plastic waste annually with only 4% being recycled.",
      color: "#1A691A",
      stats: "17M tons",
    },
    {
      icon: <Coins className="h-10 w-10" />,
      title: "Economic Challenges",
      description: "Informal waste collectors earn less than $2 per day despite providing essential services.",
      color: "#4C862D",
      stats: "<$2/day",
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "Financial Exclusion",
      description: "57% of Africa's population lacks access to financial services, limiting economic opportunities.",
      color: "#5F9E00",
      stats: "57%",
    },
  ]

  const solutions = [
    {
      icon: <Recycle className="h-10 w-10" />,
      title: "Multi-Stream Collection",
      description: "Efficient collection and verification of plastic, e-waste, and metal waste streams.",
      color: "#1A691A",
    },
    {
      icon: <Coins className="h-10 w-10" />,
      title: "Tokenized Incentives",
      description: "Direct cryptocurrency payments to collectors for verified waste collection.",
      color: "#4C862D",
    },
    {
      icon: <Users className="h-10 w-10" />,
      title: "Marketplace Ecosystem",
      description: "Trading platform for recycled materials and carbon/waste offset marketplace.",
      color: "#5F9E00",
    },
  ]

  if (!mounted) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <section id="impact" className="relative py-32 overflow-hidden bg-black">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#1A691A]/20 to-black" />

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
              The Problem & Our Solution
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            Africa faces significant waste management challenges that AfriCycle addresses through innovative blockchain
            technology.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
          {/* Problems Column */}
          <div>
            <motion.h3
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center"
            >
              <span className="w-12 h-12 rounded-full bg-[#1A691A] flex items-center justify-center mr-4 text-xl">
                1
              </span>
              <span className="bg-gradient-to-r from-white to-[#AEE55B] bg-clip-text text-transparent">
                The Challenges
              </span>
            </motion.h3>

            <div className="space-y-8">
              {problems.map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
                >
                  <Card className="overflow-hidden bg-black/40 backdrop-blur-sm border-[#1A691A]/30 hover:border-[#AEE55B]/50 transition-all duration-500 group">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div
                          className="p-6 flex items-center justify-center w-24"
                          style={{ backgroundColor: `${problem.color}40` }}
                        >
                          <div className="text-[#AEE55B] group-hover:scale-110 transition-transform duration-300">
                            {problem.icon}
                          </div>
                        </div>
                        <div className="p-6 flex-1">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xl font-bold mb-2 text-white group-hover:text-[#AEE55B] transition-colors">
                              {problem.title}
                            </h4>
                            <div className="text-[#AEE55B] font-bold text-xl">{problem.stats}</div>
                          </div>
                          <p className="text-gray-400">{problem.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Solutions Column */}
          <div>
            <motion.h3
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-2xl md:text-3xl font-bold text-white mb-8 flex items-center"
            >
              <span className="w-12 h-12 rounded-full bg-[#5F9E00] flex items-center justify-center mr-4 text-xl">
                2
              </span>
              <span className="bg-gradient-to-r from-white to-[#AEE55B] bg-clip-text text-transparent">
                Our Solutions
              </span>
            </motion.h3>

            <div className="space-y-8">
              {solutions.map((solution, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.2 }}
                >
                  <Card className="overflow-hidden bg-black/40 backdrop-blur-sm border-[#1A691A]/30 hover:border-[#AEE55B]/50 transition-all duration-500 group">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div
                          className="p-6 flex items-center justify-center w-24"
                          style={{ backgroundColor: `${solution.color}40` }}
                        >
                          <div className="text-[#AEE55B] group-hover:scale-110 transition-transform duration-300">
                            {solution.icon}
                          </div>
                        </div>
                        <div className="p-6 flex-1">
                          <h4 className="text-xl font-bold mb-2 text-white group-hover:text-[#AEE55B] transition-colors flex items-center">
                            {solution.title}
                            <ArrowRight className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          </h4>
                          <p className="text-gray-400">{solution.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="mt-8 p-6 bg-gradient-to-r from-[#1A691A]/30 to-[#5F9E00]/30 rounded-xl border border-[#AEE55B]/20"
            >
              <h4 className="text-xl font-bold text-[#AEE55B] mb-4">The AfriCycle Impact</h4>
              <p className="text-gray-300 mb-4">
                By connecting waste collectors with recycling facilities and corporate partners through blockchain,
                we're creating a sustainable ecosystem that benefits all participants while solving critical
                environmental challenges.
              </p>
              <div className="flex items-center text-[#AEE55B] font-medium cursor-pointer group">
                <span>Learn more about our impact</span>
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

