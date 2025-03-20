"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUp, Twitter, Github, Linkedin, Mail } from "lucide-react"

export default function Footer() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  if (!mounted) {
    return <div className="h-96 bg-black" />
  }

  return (
    <footer className="relative bg-black pt-20 pb-10 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1A691A]/20 via-black to-black" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center mb-6"
            >
              <div className="w-10 h-10 rounded-full bg-[#1A691A] flex items-center justify-center mr-3">
                <div className="w-6 h-6 rounded-full bg-[#AEE55B] flex items-center justify-center text-black font-bold text-xs">
                  AC
                </div>
              </div>
              <span className="text-xl font-bold text-[#AEE55B]">AfriCycle</span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-gray-400 mb-6"
            >
              Transforming Africa's waste management through blockchain technology, creating economic opportunities
              while solving environmental challenges.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex space-x-4"
            >
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#1A691A]/30 flex items-center justify-center text-[#AEE55B] hover:bg-[#1A691A] transition-colors"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#1A691A]/30 flex items-center justify-center text-[#AEE55B] hover:bg-[#1A691A] transition-colors"
              >
                <Github size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#1A691A]/30 flex items-center justify-center text-[#AEE55B] hover:bg-[#1A691A] transition-colors"
              >
                <Linkedin size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-[#1A691A]/30 flex items-center justify-center text-[#AEE55B] hover:bg-[#1A691A] transition-colors"
              >
                <Mail size={18} />
              </a>
            </motion.div>
          </div>

          {/* Quick Links */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-white font-bold mb-6"
            >
              Quick Links
            </motion.h3>
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-3"
            >
              {["Home", "About Us", "How It Works", "Ecosystem", "Roadmap", "FAQ"].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-gray-400 hover:text-[#AEE55B] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Resources */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-white font-bold mb-6"
            >
              Resources
            </motion.h3>
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-3"
            >
              {["Whitepaper", "Documentation", "Blog", "Press Kit", "Careers", "Contact"].map((item, index) => (
                <li key={index}>
                  <a href="#" className="text-gray-400 hover:text-[#AEE55B] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </motion.ul>
          </div>

          {/* Newsletter */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="text-white font-bold mb-6"
            >
              Newsletter
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-gray-400 mb-4"
            >
              Subscribe to our newsletter for the latest updates.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="flex"
            >
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-4 py-2 bg-black/60 border border-[#1A691A]/30 rounded-l-md text-white focus:outline-none focus:border-[#AEE55B]"
              />
              <button className="px-4 py-2 bg-[#AEE55B] text-black rounded-r-md hover:bg-[#AEE55B]/90 transition-colors">
                Subscribe
              </button>
            </motion.div>
          </div>
        </div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="h-px bg-gradient-to-r from-transparent via-[#5F9E00]/50 to-transparent mb-8"
        />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="text-gray-500 text-sm mb-4 md:mb-0"
          >
            © {new Date().getFullYear()} AfriCycle. All rights reserved.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex space-x-6"
          >
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item, index) => (
              <a key={index} href="#" className="text-gray-500 text-sm hover:text-[#AEE55B] transition-colors">
                {item}
              </a>
            ))}
          </motion.div>
        </div>

        {/* Back to Top Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.3 }}
          onClick={scrollToTop}
          className="absolute right-6 bottom-0 w-12 h-12 rounded-full bg-[#1A691A] flex items-center justify-center text-[#AEE55B] hover:bg-[#5F9E00] transition-colors"
          whileHover={{ y: -5 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUp size={20} />
        </motion.button>
      </div>
    </footer>
  )
}

