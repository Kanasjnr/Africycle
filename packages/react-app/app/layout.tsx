import type { Metadata } from 'next';
import "@/styles/globals.css";
// import { Inter } from "next/font/google";
import { Providers } from "@/providers/Providers";

// Temporarily disable Google Fonts to fix build issues
// const inter = Inter({
//   subsets: ["latin"],
//   display: 'swap',
//   fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
//   preload: true,
//   adjustFontFallback: true,
// });

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
      <body className="min-h-screen bg-background font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
