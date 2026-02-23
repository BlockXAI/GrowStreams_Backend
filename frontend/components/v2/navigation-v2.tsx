"use client"

import { useState, useEffect } from "react"
import { Menu, X, ArrowUpRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"

const navLinks = [
  { label: "Protocol", href: "/protocol" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Developers", href: "/developers" },
  { label: "Ecosystem", href: "/ecosystem" },
]

export function NavigationV2({ currentPage = "home" }: { currentPage?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-provn-bg/80 backdrop-blur-xl border-b border-provn-border/50"
            : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="GrowStreams"
                  width={180}
                  height={40}
                  priority
                  className="h-10 w-auto object-contain"
                />
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = currentPage === link.href.replace("/", "")
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                      isActive
                        ? "text-provn-text"
                        : "text-provn-muted hover:text-provn-text"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-lg bg-provn-surface border border-provn-border/50"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{link.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/developers"
                className="text-sm font-medium text-provn-muted hover:text-provn-text transition-colors"
              >
                Docs
              </Link>
              <Link
                href="/app"
                className="btn-shimmer inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
              >
                Launch App
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-lg text-provn-muted hover:text-provn-text hover:bg-provn-surface/50 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-provn-bg/90 backdrop-blur-xl"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div
              className="relative z-10 flex flex-col pt-24 px-6 pb-8 h-full"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-4 text-2xl font-medium text-provn-text hover:text-emerald-400 transition-colors border-b border-provn-border/30"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <Link
                  href="/app"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-6 py-4 text-lg font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl"
                >
                  Launch App
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
