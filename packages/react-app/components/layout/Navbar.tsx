'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMiniPay } from '@/providers/AppProvider';
import { useAccount } from 'wagmi';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMiniPay, isAutoConnecting } = useMiniPay();
  const { isConnected } = useAccount();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const mobileMenu = document.getElementById('mobile-menu');
      const menuButton = document.getElementById('menu-button');
      if (mobileMenu && !mobileMenu.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render connect button or loading state
  const renderWalletConnection = () => {
    if (isMiniPay) {
      if (isAutoConnecting) {
        return (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </div>
        );
      }
      if (isConnected) {
        return (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Connected</span>
          </div>
        );
      }
      return null; // Hide connect button for MiniPay users
    }
    return <ConnectButton />;
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/Africycle.png"
                alt="AfriCycle Logo"
                width={180}
                height={40}
                priority
                className="h-10 w-auto"
              />
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-foreground/80 hover:text-primary transition-colors font-semibold"
            >
              Features
            </Link>
            <Link
              href="#W"
              className="text-foreground/80 hover:text-primary transition-colors font-semibold"
            >
              Waste Streams
            </Link>
            <Link
              href="#HowItWorks"
              className="text-foreground/80 hover:text-primary transition-colors font-semibold"
            >
              How It Works
            </Link>
           
            {renderWalletConnection()}
          </nav>

          <div className="md:hidden">
            <Button
              id="menu-button"
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden fixed inset-x-0 top-20 bg-background/95 backdrop-blur-md shadow-lg transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="container mx-auto px-4 py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="#features"
                className="text-foreground/80 hover:text-primary transition-colors font-semibold py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#W"
                className="text-foreground/80 hover:text-primary transition-colors font-semibold py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Waste Streams
              </Link>
              <Link
                href="#HowItWorks"
                className="text-foreground/80 hover:text-primary transition-colors font-semibold py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#Stakeholders"
                className="text-foreground/80 hover:text-primary transition-colors font-semibold py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Stakeholders
              </Link>
              <div className="py-2">
                {renderWalletConnection()}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
