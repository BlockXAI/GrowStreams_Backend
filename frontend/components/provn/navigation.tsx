"use client";

import { useState, useEffect } from "react";
import { CampModal, useAuth } from "@campnetwork/origin/react";
import { Menu, X, Wallet, User } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CreateProfileModal } from "./create-profile-modal";
import { useProfile } from "@/hooks/useProfile";
import Image from "next/image";

interface NavigationProps {
  currentPage?:
    | "home"
    | "upload"
    | "dashboard"
    | "video"
    | "provs"
    | "profile"
    | "explore";
}

// Custom Provn Logo Component
const ProvnLogo = ({ isScrolled }: { isScrolled: boolean }) => {
  return (
    <motion.div
      className="flex items-center"
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      <Image
        src="/logo.png"
        alt="Logo"
        width={isScrolled ? 300 : 360}
        height={88}
        priority
        className="h-24 w-auto object-contain"
      />
    </motion.div>
  );
};

export function Navigation({ currentPage }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCreateProfile, setShowCreateProfile] = useState(false);
  const { scrollY } = useScroll();
  const { isAuthenticated, walletAddress } = useAuth();
  const { profile, loading, error } = useProfile(walletAddress || undefined);
  
  // Debug modal state
  // No-op: modal hooks removed with auth
  
  // Debug authentication state
  useEffect(() => {
  console.log("🔍 Navigation: Auth state:", { isAuthenticated, walletAddress });
  }, [isAuthenticated, walletAddress]);
  
  // No-op auth state logs removed
  // Debug logging
  useEffect(() => {
    console.log("🔍 Navigation: Profile state:", {
      walletAddress,
      profile,
      loading,
      error,
      hasProfile: !!profile,
    });

    // Debug: Check if profile API is working
    if (walletAddress && !profile && !loading) {
      console.log("🔍 Navigation: Testing profile API directly...");
      fetch(`/api/profile/${walletAddress}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("🔍 Navigation: Direct API test result:", data);
        })
        .catch((err) => {
          console.error("🔍 Navigation: Direct API test error:", err);
        });
    }
  }, [walletAddress, profile, loading, error]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);

  return (
    <>
      
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex w-full items-center justify-between">
            {/* Left: Logo inside navbar */}
            <motion.a
              href="/"
              className="flex items-center rounded-lg outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              aria-label="Provn - Go to homepage"
            >
              <ProvnLogo isScrolled={isScrolled} />
            </motion.a>

            {/* Center: Desktop Navigation inside bordered pill container */}
            <motion.div
              className="hidden md:flex items-center gap-8 border border-provn-border/60 rounded-2xl px-6 py-2 bg-transparent backdrop-blur-0 mx-auto"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
            >
              <NavLink href="/explore" currentPage={currentPage} page="explore">
                Explore
              </NavLink>
              <NavLink href="/upload" currentPage={currentPage} page="upload">
                Create
              </NavLink>
              <NavLink
                href="/dashboard"
                currentPage={currentPage}
                page="dashboard"
              >
                Leaderboard
              </NavLink>
            </motion.div>

            {/* Right: Mobile menu button */}
            <motion.div
              className="md:hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-xl text-provn-muted hover:text-provn-text hover:bg-provn-surface/50 focus:outline-none transition-all duration-200 ${
                  isScrolled ? "bg-provn-surface/30" : ""
                }`}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label="Toggle navigation menu"
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </motion.div>
          </div>
        </div>
        {/* CampModal for wallet connection/disconnection */}
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* <div className="w-full h-full">
            <CampModal />
          </div> */}
        </div>
        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={isMenuOpen ? "open" : "closed"}
          variants={{
            open: {
              opacity: 1,
              height: "auto",
              y: 0,
            },
            closed: {
              opacity: 0,
              height: 0,
              y: -10,
            },
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden overflow-hidden bg-provn-bg/95 backdrop-blur-xl border-t border-provn-border/50"
          id="mobile-menu"
        >
          <div className="px-4 py-6 space-y-4">
            <MobileNavLink href="/explore" onClick={() => setIsMenuOpen(false)}>
              Explore Provs
            </MobileNavLink>
            <MobileNavLink href="/upload" onClick={() => setIsMenuOpen(false)}>
              Create Content
            </MobileNavLink>
            <MobileNavLink
              href="/dashboard"
              onClick={() => setIsMenuOpen(false)}
            >
              Leaderboard
            </MobileNavLink>

            {/* Mobile Wallet Connection */}
            <div className="pt-4 border-t border-provn-border/30">
              {/* Public site: remove wallet actions */}
            </div>
          </div>
        </motion.div>
      

      {/* Create Profile Modal */}
  {/* Public site: profile creation disabled when auth is removed */}
    </>
  );
}

// Desktop Navigation Link Component
const NavLink = ({
  href,
  children,
  currentPage,
  page,
}: {
  href: string;
  children: React.ReactNode;
  currentPage?: string;
  page: string;
}) => {
  const isActive = currentPage === page;

  return (
    <motion.a
      href={href}
      className={`group relative inline-flex items-center px-4 py-2 font-medium transition-colors duration-200 focus:outline-none ${
        isActive ? "text-provn-text" : "text-provn-muted hover:text-provn-text"
      }`}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
      <span
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[2px] h-px rounded-full bg-white/90 transition-all duration-300 ${
          isActive ? "w-2/3" : "w-0 group-hover:w-2/3"
        }`}
      />
    </motion.a>
  );
};

// Mobile Navigation Link Component
const MobileNavLink = ({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <motion.a
      href={href}
      onClick={onClick}
      className="block px-4 py-3 text-provn-text hover:text-provn-accent hover:bg-provn-surface/30 rounded-lg transition-all duration-200 font-medium"
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.a>
  );
};
