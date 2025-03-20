"use client"

import { useRef } from "react"
import { useInView } from "framer-motion"
import Image from "next/image"
import { Smartphone, BarChart4, Building2, Recycle, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function HowItWorks() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  const steps = [
    {
      icon: <Smartphone className="h-10 w-10 text-primary" />,
      title: "Waste Collection",
      description: "Collectors gather waste and document it through the mobile app with photo verification.",
    },
    {
      icon: <Recycle className="h-10 w-10 text-primary" />,
      title: "Verification & Processing",
      description: "Waste is verified at collection centers and processed according to stream-specific protocols.",
    },
    {
      icon: <BarChart4 className="h-10 w-10 text-primary" />,
      title: "Tokenized Rewards",
      description: "Collectors receive cryptocurrency payments based on quantity and quality of materials.",
    },
    {
      icon: <Building2 className="h-10 w-10 text-primary" />,
      title: "Corporate Integration",
      description: "Businesses purchase recycled materials and verified sustainability credits.",
    },
  ]

  return (
    <section id="how-it-works" className="py-24 bg-primary/5" ref={sectionRef}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">How AfriCycle Works</h2>
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Our blockchain-powered platform connects all stakeholders in the waste management ecosystem.
          </p>
        </motion.div>

        <div className="relative">
          <motion.div
            className="absolute top-12 left-0 right-0 h-0.5 bg-primary/20 hidden lg:block"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          ></motion.div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.2 }}
              >
                <div className="flex flex-col items-center lg:items-start">
                  <motion.div
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 lg:mb-8"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {step.icon}
                  </motion.div>
                  <motion.div
                    className="hidden lg:flex absolute top-10 left-10 h-10 w-10 rounded-full border-4 border-background bg-primary text-xs font-bold text-white items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : { scale: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.5 + index * 0.2 }}
                  >
                    {index + 1}
                  </motion.div>
                  <h3 className="mt-6 lg:mt-0 text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-center lg:text-left text-muted-foreground font-medium">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <motion.div
                    className="hidden lg:block absolute top-10 left-[calc(100%_-_16px)] transform -translate-x-1/2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.2 }}
                  >
                    <ArrowRight className="h-10 w-10 text-primary/60" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>


        <div className="mt-24 rounded-2xl overflow-hidden shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="bg-primary p-8 lg:p-12 text-white">
              <h3 className="text-2xl font-bold mb-6">Technical Architecture</h3>
              <p className="mb-8">
                Built on the Celo blockchain platform for its mobile-first design, low transaction costs, and
                sustainable consensus mechanism.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-white/10 p-2 mt-1">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Mobile-First Design</h4>
                    <p className="text-white/80 text-sm">
                      Lightweight client implementation suitable for low-end devices with minimal data requirements.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-white/10 p-2 mt-1">
                    <BarChart4 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Low Transaction Costs</h4>
                    <p className="text-white/80 text-sm">
                      Gas fees under $0.001 per transaction enabling micro-rewards with batch processing capabilities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="rounded-full bg-white/10 p-2 mt-1">
                    <Recycle className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium">Sustainable Consensus</h4>
                    <p className="text-white/80 text-sm">
                      Proof-of-Stake validation aligning with environmental mission on a carbon-negative blockchain.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1632&auto=format&fit=crop"
                alt="AfriCycle Technical Architecture"
                width={600}
                height={500}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

