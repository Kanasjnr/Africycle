import { Inter } from "next/font/google"
import "../styles/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AfriCycle - Transforming Waste into Wealth with Blockchain",
  description:
    "AfriCycle is a blockchain-powered circular economy platform that addresses Africa's waste management crisis while creating economic opportunities.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}

