import type { Metadata } from "next"
import ClientPage from "./ClientPage"

export const metadata: Metadata = {
  title: "AfriCycle | Blockchain-Powered Waste Management Ecosystem",
  description:
    "A multi-stream ReFi waste management ecosystem built on Celo blockchain, transforming Africa's waste challenges into economic opportunities.",
}

export default function Home() {
  return <ClientPage />
}

