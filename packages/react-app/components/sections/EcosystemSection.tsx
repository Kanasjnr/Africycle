"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Recycle, Leaf, Users, Building, ArrowRight } from "lucide-react"

export default function EcosystemSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const tokenDistribution = [
    { name: "Collector Rewards", percentage: 30, color: "#5F9E00", icon: <Recycle className="h-6 w-6" /> },
    { name: "Ecosystem Growth", percentage: 20, color: "#4C862D", icon: <Leaf className="h-6 w-6" /> },
    { name: "Community DAO", percentage: 30, color: "#AEE55B", icon: <Users className="h-6 w-6" /> },
    { name: "Team & Reserve", percentage: 20, color: "#1A691A", icon: <Building className="h-6 w-6" /> },
  ]

  // Mock transaction data
  const transactions = [
    {
      id: "tx1",
      collector: "0x1a2b...3c4d",
      amount: "25.5 AC",
      wasteType: "Plastic",
      timestamp: "2 mins ago",
    },
    {
      id: "tx2",
      collector: "0x5e6f...7g8h",
      amount: "42.3 AC",
      wasteType: "E-Waste",
      timestamp: "5 mins ago",
    },
    {
      id: "tx3",
      collector: "0x9i0j...1k2l",
      amount: "18.7 AC",
      wasteType: "Metal",
      timestamp: "12 mins ago",
    },
  ]

  if (!mounted) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <section id="ecosystem" className="relative py-32 overflow-hidden bg-black">
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
              Tokenized Economy & Marketplace
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto text-lg"
          >
            AfriCycle's blockchain-powered marketplace connects waste collectors with recycling facilities and corporate
            partners.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Token Distribution */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="h-full bg-black/40 backdrop-blur-sm border-[#1A691A]/30">
              <CardHeader>
                <CardTitle className="text-[#AEE55B] text-2xl">Token Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 mb-8">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <defs>
                      <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1A691A" />
                        <stop offset="100%" stopColor="#5F9E00" />
                      </linearGradient>
                    </defs>
                    {tokenDistribution.map((token, index) => {
                      const startAngle =
                        tokenDistribution.slice(0, index).reduce((acc, curr) => acc + curr.percentage, 0) * 3.6
                      const endAngle = startAngle + token.percentage * 3.6

                      const startRad = (startAngle - 90) * (Math.PI / 180)
                      const endRad = (endAngle - 90) * (Math.PI / 180)

                      const x1 = 100 + 70 * Math.cos(startRad)
                      const y1 = 100 + 70 * Math.sin(startRad)
                      const x2 = 100 + 70 * Math.cos(endRad)
                      const y2 = 100 + 70 * Math.sin(endRad)

                      const largeArcFlag = token.percentage > 50 ? 1 : 0

                      return (
                        <motion.path
                          key={index}
                          d={`M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={token.color}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.2 }}
                        />
                      )
                    })}

                    <circle cx="100" cy="100" r="40" fill="black" />
                    <text
                      x="100"
                      y="100"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#AEE55B"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      AC Token
                    </text>
                  </svg>
                </div>

                <div className="space-y-4">
                  {tokenDistribution.map((token, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                      className="flex items-center"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-4 text-black"
                        style={{ backgroundColor: token.color }}
                      >
                        {token.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-white">{token.name}</span>
                          <span className="font-bold text-[#AEE55B]">{token.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <motion.div
                            className="h-2 rounded-full"
                            style={{ backgroundColor: token.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${token.percentage}%` }}
                            transition={{ duration: 1, delay: 1 + index * 0.1 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.2 }}
                  className="mt-8 p-4 bg-[#1A691A]/20 rounded-lg border border-[#5F9E00]/30"
                >
                  <h4 className="font-medium text-[#AEE55B] mb-2">Token Utility</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#AEE55B] mr-2"></div>
                      <span>Incentivize waste collection and recycling</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#AEE55B] mr-2"></div>
                      <span>Purchase verified recycling credits</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#AEE55B] mr-2"></div>
                      <span>Governance and decision-making</span>
                    </li>
                  </ul>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs: Transaction Feed & Corporate Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Tabs defaultValue="transactions" className="h-full">
              <TabsList className="bg-black/60 w-full border border-[#1A691A]/30 p-1">
                <TabsTrigger
                  value="transactions"
                  className="flex-1 data-[state=active]:bg-[#5F9E00] data-[state=active]:text-black"
                >
                  Transaction Feed
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="flex-1 data-[state=active]:bg-[#5F9E00] data-[state=active]:text-black"
                >
                  Corporate Dashboard
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="mt-4">
                <Card className="h-full bg-black/40 backdrop-blur-sm border-[#1A691A]/30">
                  <CardHeader>
                    <CardTitle className="text-[#AEE55B] text-2xl">Live Transaction Feed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactions.map((tx, index) => (
                        <motion.div
                          key={tx.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                          className="bg-[#1A691A]/20 p-4 rounded-lg border border-[#5F9E00]/30 hover:border-[#AEE55B]/50 transition-all duration-300"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-[#AEE55B] font-medium">{tx.collector}</p>
                              <p className="text-gray-400 text-sm">{tx.wasteType} Collection</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold">{tx.amount}</p>
                              <p className="text-gray-400 text-sm">{tx.timestamp}</p>
                            </div>
                          </div>
                          <div className="mt-2 w-full bg-black/50 h-1 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 1, delay: 0.8 + index * 0.2 }}
                              className="h-full bg-[#AEE55B]"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 text-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-[#AEE55B] font-medium hover:underline flex items-center mx-auto"
                      >
                        <span>View All Transactions</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dashboard" className="mt-4">
                <Card className="h-full bg-black/40 backdrop-blur-sm border-[#1A691A]/30">
                  <CardHeader>
                    <CardTitle className="text-[#AEE55B] text-2xl">Corporate Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="bg-[#1A691A]/20 p-4 rounded-lg border border-[#5F9E00]/30"
                      >
                        <h3 className="text-white font-medium mb-2">Sustainability Impact</h3>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <p className="text-[#AEE55B] text-xl font-bold">125</p>
                            <p className="text-gray-400 text-xs">Tons CO2 Offset</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[#AEE55B] text-xl font-bold">45,230</p>
                            <p className="text-gray-400 text-xs">Plastic Bottles</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[#AEE55B] text-xl font-bold">1,250</p>
                            <p className="text-gray-400 text-xs">E-Waste Units</p>
                          </div>
                        </div>
                        <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "75%" }}
                            transition={{ duration: 1, delay: 0.8 }}
                            className="h-full bg-[#AEE55B]"
                          />
                        </div>
                        <p className="text-right text-gray-400 text-xs mt-1">75% of quarterly goal</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="bg-[#1A691A]/20 p-4 rounded-lg border border-[#5F9E00]/30"
                      >
                        <h3 className="text-white font-medium mb-2">Recycling Credits</h3>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400">Available:</span>
                          <span className="text-[#AEE55B] font-bold">2,500 Credits</span>
                        </div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-gray-400">Used:</span>
                          <span className="text-white font-bold">1,750 Credits</span>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-full py-2 bg-[#5F9E00] text-black rounded-md font-medium"
                        >
                          Purchase More Credits
                        </motion.button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

