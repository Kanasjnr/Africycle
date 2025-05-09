import type { Metadata } from 'next';
import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { AppProvider } from "@/providers/AppProvider";
import { RoleProvider } from '@/providers/RoleProvider';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AfriCycle | Blockchain-Powered Waste Management Ecosystem",
  description:
    "A multi-stream ReFi waste management ecosystem built on Celo blockchain, transforming Africa's waste challenges into economic opportunities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <RoleProvider>
          <AppProvider>
            {children}
          </AppProvider>
        </RoleProvider>
      </body>
    </html>
  );
}
