"use client"

import { useEffect, useState } from "react"

export default function PreLoader({ onFinish }) {
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer)
          if (onFinish) setTimeout(onFinish, 500)
          return 100
        }
        return prev + 5
      })
    }, 50)

    return () => clearInterval(timer)
  }, [onFinish])

  // Don't render anything during SSR
  if (!mounted) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="relative flex flex-col items-center">
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#1A691A] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#5F9E00] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#AEE55B] flex items-center justify-center text-black font-bold text-xl">
                  AC
                </div>
              </div>
            </div>
          </div>

          <div className="absolute inset-0">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#AEE55B"
                strokeWidth="2"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>
        </div>

        <p className="text-[#AEE55B] text-xl font-medium">AFRICYCLE</p>

        <p className="text-gray-400 text-sm mt-2">Transforming Waste into Wealth</p>

        <p className="text-[#AEE55B] mt-8">{progress}%</p>
      </div>
    </div>
  )
}

