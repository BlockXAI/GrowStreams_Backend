"use client"
import React, { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"
import { ProvnButton } from "@/components/provn/button"
import { VaraWallet } from "@/components/provn/VaraWallet"
import { 
  Upload, 
  Users, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  Play,
  Zap,
  ShieldCheck,
  Percent,
  BadgeCheck,
  Building2,
  Mail,
  Trophy,
  Github,
  Award,
  Sparkles
} from "lucide-react"


// Creator Success Story Component
const CreatorStory = ({ 
  name, 
  avatar, 
  platform, 
  oldEarnings, 
  newEarnings, 
  timeframe,
  quote 
}: {
  name: string
  avatar: string  
  platform: string
  oldEarnings: string
  newEarnings: string
  timeframe: string
  quote: string
}) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-provn-surface border border-provn-border rounded-2xl p-6 h-full"
    >
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-provn-accent rounded-full flex items-center justify-center mr-3">
          <span className="text-provn-bg font-bold text-lg">{avatar}</span>
        </div>
        <div>
          <h4 className="font-semibold text-provn-text">{name}</h4>
          <p className="text-sm text-provn-muted">Former {platform} Creator</p>
        </div>
      </div>
      
      <blockquote className="text-provn-text mb-4 italic">
        "{quote}"
      </blockquote>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-provn-muted">{platform} ({timeframe}):</span>
          <span className="text-red-400">{oldEarnings}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-provn-muted">Provn ({timeframe}):</span>
          <span className="text-provn-success font-bold">{newEarnings}</span>
        </div>
        <div className="pt-2 border-t border-provn-border">
          <div className="text-provn-accent font-bold text-right">
            +{Math.round(((parseFloat(newEarnings.replace('$', '').replace('K', '000')) - parseFloat(oldEarnings.replace('$', '').replace('K', '000'))) / parseFloat(oldEarnings.replace('$', '').replace('K', '000'))) * 100)}% increase
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Platform Metrics Component  
const LiveMetrics = ({ creatorsCount, videosCount }: { creatorsCount: number, videosCount: number }) => {
  const metrics = [
    { label: "Active Creators", value: creatorsCount.toString(), icon: Users },
    { label: "Total Earnings", value: "$2.3M", icon: DollarSign },
    { label: "Provs Protected", value: videosCount.toString(), icon: CheckCircle },
    { label: "Zero Platform Fees", value: "100%", icon: CheckCircle }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            viewport={{ once: true }}
            className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center"
          >
            <Icon className="w-8 h-8 text-provn-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-provn-text font-headline">
              {metric.value}
            </div>
            <div className="text-sm text-provn-muted">
              {metric.label}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default function HomePage() {
  const { scrollYProgress } = useScroll()
  const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })
  
  // Real platform data
  const [platformData, setPlatformData] = useState({
    creatorsCount: 4, // Default fallback
    videosCount: 3   // Default fallback
  })
  
  // Pricing & comparison calculations
  const baseRevenue = 1000
  const competitorRate = 0.30 // 30% platforms benchmark
  const fiverrRate = 0.20
  const ourRatePromo = 0.0     // first usage free
  const ourRateStandard = 0.0275 // 2.75% thereafter

  const competitorKeep = baseRevenue * (1 - competitorRate) // 700
  const fiverrKeep = baseRevenue * (1 - fiverrRate) // 800
  const ourKeepPromo = baseRevenue * (1 - ourRatePromo) // 1000
  const ourKeepStandard = baseRevenue * (1 - ourRateStandard) // 975

  const diffPromoVs30 = ourKeepPromo - competitorKeep // 300
  const diffStdVs30 = ourKeepStandard - competitorKeep // 275

  const formatCurrency = (n: number) => {
    const s = n.toFixed(2)
      .replace(/\.00$/, '')
      .replace(/(\.\d)0$/, '$1')
    return `$${s}`
  }
  
  // Fetch real platform data
  useEffect(() => {
    const fetchPlatformData = async () => {
      try {
        const [creatorsResponse, videosResponse] = await Promise.all([
          fetch('/api/leaderboard?limit=1000'), // Get all creators
          fetch('/api/platform-stats') // We'll create this endpoint
        ])
        
        const creatorsData = await creatorsResponse.json()
        
        if (creatorsData.success) {
          setPlatformData(prev => ({
            ...prev,
            creatorsCount: creatorsData.data.stats.total_creators
          }))
        }
        
        // Try to get video count from existing endpoint or use fallback
        try {
          const videosData = await videosResponse.json()
          if (videosData.success) {
            setPlatformData(prev => ({
              ...prev,
              videosCount: videosData.videosCount
            }))
          }
        } catch (e) {
          // Keep fallback value if endpoint doesn't exist
        }
        
      } catch (error) {
        console.error('Failed to fetch platform data:', error)
        // Keep fallback values
      }
    }
    
    fetchPlatformData()
  }, [])

  return (
    <div className="min-h-screen font-headline bg-provn-bg">
      <Navigation currentPage="home" />
      
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-20 md:pt-16"
        style={{ opacity: headerOpacity }}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 8, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute top-20 right-20 w-96 h-96 bg-provn-accent/5 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-4xl mx-auto z-10 text-center">
          {/* Hero Message - Full Width */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20 mb-6">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Grow Streams · Private Beta
                </ProvnBadge>
              </motion.div>
              
              <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold text-provn-text leading-tight">
                Real-time <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-provn-accent/80">payments </span> 
                for verified contributions.
              </h1>
              
              <p className="text-xl font-headline md:text-2xl text-provn-muted leading-relaxed max-w-3xl mx-auto">
                AI-verified contributions, per-second streaming, and portable reputation NFTs — at 2.5% fees.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <ProvnButton
                size="lg"
                onClick={() => (window.location.hash = "join-beta")}
                className="px-12 py-4 text-xl font-semibold group"
              >
                <Upload className="w-6 h-6 mr-2 group-hover:rotate-12 transition-transform" />
                Join the Beta
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </ProvnButton>
              <ProvnButton
                variant="secondary"
                size="lg"
                onClick={() => (window.location.hash = "book-demo")}
                className="px-12 py-4 text-xl group"
              >
                <Play className="w-6 h-6 mr-2 group-hover:scale-110 transition-transform" />
                Book a Demo
              </ProvnButton>
            </div>

            {/* Social Proof Strip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-12 border-t border-provn-border/30"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="text-sm text-provn-muted">Trusted by teams at</div>
                <div className="flex flex-wrap items-center justify-center gap-6 opacity-80">
                  <div className="h-6 w-24 bg-provn-surface-2 rounded" />
                  <div className="h-6 w-20 bg-provn-surface-2 rounded" />
                  <div className="h-6 w-28 bg-provn-surface-2 rounded" />
                  <div className="h-6 w-16 bg-provn-surface-2 rounded" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Web3 Contribution Campaign Banner */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border-2 border-provn-accent/50 bg-gradient-to-br from-provn-surface/90 via-provn-surface-2/90 to-provn-surface/90 backdrop-blur-xl shadow-2xl"
          >
            {/* Animated Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 0]
                }}
                transition={{ 
                  duration: 20,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-24 -right-24 w-96 h-96 bg-provn-accent/10 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  rotate: [90, 0, 90]
                }}
                transition={{ 
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
              />
            </div>

            <div className="relative p-8 md:p-12">
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
                <div className="flex-1 text-center lg:text-left">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 mb-4"
                  >
                    <ProvnBadge className="bg-gradient-to-r from-provn-accent/20 to-purple-500/20 text-provn-accent border-provn-accent/30">
                      <Sparkles className="w-4 h-4 mr-1" />
                      Live Now
                    </ProvnBadge>
                    <ProvnBadge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                      <Trophy className="w-4 h-4 mr-1" />
                      $2,500 Prize Pool
                    </ProvnBadge>
                  </motion.div>
                  
                  <h2 className="text-3xl md:text-5xl font-bold text-provn-text mb-4 leading-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-provn-accent via-purple-500 to-provn-accent">
                      Web3 Contribution Challenge
                    </span>
                  </h2>
                  
                  <p className="text-lg md:text-xl text-provn-muted max-w-2xl">
                    Prove your GitHub impact, mint your Scorecard NFT on Vara Network, and compete for prizes
                  </p>
                </div>

                {/* Wallet Connect Widget */}
                <div className="flex-shrink-0">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="bg-provn-surface border border-provn-border rounded-2xl p-4 shadow-lg"
                  >
                    <VaraWallet />
                  </motion.div>
                </div>
              </div>

              {/* Campaign Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="bg-provn-surface/60 backdrop-blur-sm border border-provn-border/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-provn-accent/15 border border-provn-accent/30 flex items-center justify-center">
                      <Github className="w-5 h-5 text-provn-accent" />
                    </div>
                    <h3 className="text-provn-text font-semibold">Verify GitHub</h3>
                  </div>
                  <p className="text-sm text-provn-muted">Prove ownership with Reclaim Protocol</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-provn-surface/60 backdrop-blur-sm border border-provn-border/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-provn-text font-semibold">Get Scored</h3>
                  </div>
                  <p className="text-sm text-provn-muted">AI analyzes your contribution quality</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="bg-provn-surface/60 backdrop-blur-sm border border-provn-border/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                      <Award className="w-5 h-5 text-green-400" />
                    </div>
                    <h3 className="text-provn-text font-semibold">Mint NFT & Win</h3>
                  </div>
                  <p className="text-sm text-provn-muted">Compete for $2,500 in prizes</p>
                </motion.div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  viewport={{ once: true }}
                >
                  <ProvnButton
                    size="lg"
                    onClick={() => window.location.href = '/campaign'}
                    className="px-8 py-4 text-lg font-semibold group bg-gradient-to-r from-provn-accent to-purple-600 hover:from-provn-accent-press hover:to-purple-700"
                  >
                    <Trophy className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Join Challenge
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </ProvnButton>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  viewport={{ once: true }}
                >
                  <ProvnButton
                    variant="secondary"
                    size="lg"
                    onClick={() => window.location.href = '/campaign/leaderboard'}
                    className="px-8 py-4 text-lg group"
                  >
                    <Users className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    View Leaderboard
                  </ProvnButton>
                </motion.div>
              </div>

              {/* Timer & Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
                viewport={{ once: true }}
                className="mt-8 pt-6 border-t border-provn-border/30 flex flex-wrap justify-center gap-8 text-center"
              >
                <div>
                  <div className="text-2xl font-bold text-provn-accent">14d</div>
                  <div className="text-sm text-provn-muted">Remaining</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-provn-text">{platformData.creatorsCount}</div>
                  <div className="text-sm text-provn-muted">Participants</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">$1,000</div>
                  <div className="text-sm text-provn-muted">Grand Prize</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform Demo Section */}
      <section className="py-16 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              rotate: { duration: 30, repeat: Infinity, ease: "linear" },
              scale: { duration: 12, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -top-40 -left-40 w-80 h-80 bg-provn-accent/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ 
              rotate: [360, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 25, repeat: Infinity, ease: "linear" },
              scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute -bottom-40 -right-40 w-96 h-96 bg-provn-success/8 rounded-full blur-3xl"
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20 mb-6">
                How It Works
              </ProvnBadge>
            </motion.div>
            
            <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6 leading-tight">
              Simple, fast onboarding
            </h2>
            <p className="text-xl font-headline md:text-2xl text-provn-muted max-w-3xl mx-auto leading-relaxed">
              Connect repos → Code & stream payments → Own reputation
            </p>
          </motion.div>

          {/* How It Works: 3 Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { title: 'Connect repos', desc: 'Link your GitHub repositories securely.' },
              { title: 'Code & stream payments', desc: 'Contributions verified by AI. Payments stream in Dollar per-second.' },
              { title: 'Own reputation', desc: 'Portable on-chain Reputation NFT records your provable impact.' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                viewport={{ once: true }}
                className="bg-provn-surface/70 backdrop-blur-sm border border-provn-border/40 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-provn-accent/15 border border-provn-accent/30 text-provn-accent font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <h3 className="text-provn-text font-semibold">{step.title}</h3>
                </div>
                <p className="text-provn-muted text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Micro-diagram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <div className="relative bg-gradient-to-br from-provn-surface/80 to-provn-surface/50 border border-provn-border/40 rounded-2xl p-6 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-provn-accent/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-provn-success/10 rounded-full blur-3xl"></div>
              </div>
              <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <div className="px-4 py-2 bg-provn-surface border border-provn-border rounded-lg font-semibold text-provn-text transition-all duration-300 hover:border-provn-accent/50 hover:text-provn-accent hover:scale-[1.03]">GitHub</div>
                <span className="text-provn-muted text-xl">→</span>
                <div className="px-4 py-2 bg-provn-surface border border-provn-border rounded-lg font-semibold text-provn-text transition-all duration-300 hover:border-provn-accent/50 hover:text-provn-accent hover:scale-[1.03]">GROW STREAMS AI</div>
                <span className="text-provn-muted text-xl">→</span>
                <div className="px-4 py-2 bg-provn-surface border border-provn-border rounded-lg font-semibold text-provn-text transition-all duration-300 hover:border-provn-accent/50 hover:text-provn-accent hover:scale-[1.03]">USDC Stream</div>
                <span className="text-provn-muted text-xl">→</span>
                <div className="px-4 py-2 bg-provn-surface border border-provn-border rounded-lg font-semibold text-provn-text transition-all duration-300 hover:border-provn-accent/50 hover:text-provn-accent hover:scale-[1.03]">Reputation NFT</div>
              </div>
            </div>
          </motion.div>

          {/* (features highlight removed) */}
        </div>
      </section>

      {/* Revenue Revolution */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-provn-surface/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-headline text-5xl md:text-7xl font-bold text-provn-text mb-8 leading-tight">
              The{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600">
                30%
              </span>{" "}
              Problem
            </h2>
            <p className="text-xl font-headline md:text-2xl text-provn-muted max-w-3xl mx-auto leading-relaxed">
              Every month, builders lose <strong className="text-red-400">billions</strong> to marketplace fees.
              We're changing that forever.
            </p>
          </motion.div>

          {/* Interactive Revenue Visualization */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative bg-gradient-to-br from-provn-surface/80 to-provn-surface/40 backdrop-blur-2xl border border-provn-border/30 rounded-3xl p-12 shadow-2xl"
            >
              <div className="text-center mb-12">
                <div className="inline-flex items-baseline gap-2 mb-4">
                  <span className="text-6xl md:text-8xl font-bold text-provn-text font-headline">{formatCurrency(baseRevenue)}</span>
                  <span className="text-xl text-provn-muted">/month</span>
                </div>
                <div className="text-provn-muted">Your work generates</div>
              </div>

              {/* Revenue Split Visualization */}
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left: The Loss */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="space-y-8"
                >
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-red-400 mb-6">Marketplaces</h3>
                  </div>
                  
                  {/* Platform Breakdown */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-yellow-400" viewBox="0 0 16 16">
                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0z"/>
                          </svg>
                        </div>
                        <span className="text-yellow-400 font-medium">Upwork</span>
                      </div>
                      <div className="text-right">
                        <div className="text-yellow-400 font-bold">{Math.round(competitorRate*100)}% fee</div>
                        <div className="text-xs text-yellow-400/70">-{formatCurrency(baseRevenue * competitorRate)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-emerald-400" viewBox="0 0 16 16">
                            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0z"/>
                          </svg>
                        </div>
                        <span className="text-emerald-400 font-medium">Fiverr</span>
                      </div>
                      <div className="text-right">
                        <div className="text-emerald-400 font-bold">{Math.round(fiverrRate*100)}% fee</div>
                        <div className="text-xs text-emerald-400/70">-{formatCurrency(baseRevenue * fiverrRate)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center pt-6 border-t border-red-500/20">
                    <div className="text-4xl font-bold text-red-400 mb-2">~{formatCurrency(competitorKeep)}</div>
                    <div className="text-red-400/80">What you actually keep</div>
                  </div>
                </motion.div>

                {/* Right: The Solution */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-provn-accent/20 to-provn-success/20 rounded-2xl blur-2xl"></div>
                  <div className="relative bg-gradient-to-br from-provn-surface to-provn-surface-2 border-2 border-provn-accent/50 rounded-2xl p-8 backdrop-blur-sm">
                    <div className="text-center mb-8">
                      <div className="flex items-center justify-center mb-6">
                        <Image src="/logo.png" alt="Logo" width={64} height={64} className="rounded-xl" />
                      </div>
                      <div className="text-provn-success font-semibold text-lg">Zero Platform Fees</div>
                      <div className="text-xs text-provn-muted mt-1">First usage free, then {(ourRateStandard*100).toFixed(2).replace(/\.00$/,'')}% thereafter ({formatCurrency(baseRevenue*ourRateStandard)} on ${baseRevenue})</div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <span className="text-provn-muted">Platform Fee</span>
                        <span className="text-provn-success font-bold text-xl">{formatCurrency(baseRevenue * ourRatePromo)}</span>
                      </div>
                      
                      <div className="h-px bg-gradient-to-r from-transparent via-provn-accent/30 to-transparent my-4"></div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-provn-text font-semibold">You Keep</span>
                        <span className="text-provn-accent font-bold text-4xl">{formatCurrency(ourKeepPromo)}</span>
                      </div>
                      <div className="text-xs text-provn-muted text-right">Then {formatCurrency(ourKeepStandard)}/mo ({(ourRateStandard*100).toFixed(2).replace(/\.00$/,'')}% fee = {formatCurrency(baseRevenue*ourRateStandard)})</div>
                      
                      <div className="bg-gradient-to-r from-provn-success/20 to-provn-success/10 border border-provn-success/30 rounded-xl p-4 text-center">
                        <div className="text-provn-success font-bold text-lg">+{formatCurrency(diffPromoVs30)} first month</div>
                        <div className="text-xs text-provn-muted">then +{formatCurrency(diffStdVs30)}/mo vs 30% platforms</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
          
        </div>
      </section>

      {/* Why It’s Better (Feature Tiles) */}
      <section id="why-better" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6">
            Why It’s Better
          </h2>
          <p className="text-xl text-provn-muted max-w-3xl mx-auto">
            Real-time Payments, AI-verified code, and enterprise-grade tools — at just 2.5% fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { icon: Zap, title: 'Real-time streaming', sub: 'Dollar, per second' },
            { icon: ShieldCheck, title: 'AI code verification', sub: '~95% target accuracy' },
            { icon: Percent, title: '2.5% fees', sub: '87.5% lower' },
            { icon: BadgeCheck, title: 'Portable reputation NFTs', sub: 'Own your track record' },
            { icon: Building2, title: 'Enterprise-ready', sub: 'APIs, multi-sig, bulk payouts' },
          ].map((f, i) => {
            const I = f.icon as any
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                viewport={{ once: true }}
                className="bg-provn-surface/70 backdrop-blur-sm border border-provn-border/40 rounded-2xl p-6 h-full"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-provn-accent/15 border border-provn-accent/30 flex items-center justify-center">
                    <I className="w-5 h-5 text-provn-accent" />
                  </div>
                  <div className="text-provn-text font-semibold">{f.title}</div>
                </div>
                <div className="text-sm text-provn-muted">{f.sub}</div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Audience Benefits */}
      <section id="audience-benefits" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* For Developers */}
          <div className="bg-provn-surface/70 backdrop-blur-sm border border-provn-border/40 rounded-2xl p-6">
            <div className="mb-3">
              <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20">For Developers</ProvnBadge>
            </div>
            <h3 className="text-provn-text font-semibold mb-3">Benefit highlights</h3>
            <ul className="list-disc list-inside text-provn-text/90 space-y-1">
              <li>Instant cash flow, low fees, portable rep.</li>
            </ul>
            <div className="mt-5 p-4 rounded-xl border border-provn-border/40 bg-provn-surface/70">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-provn-accent/20 text-provn-accent font-bold flex items-center justify-center">AG</div>
                <div>
                  <div className="text-sm italic text-provn-text">“Provn streamed payouts while I coded. Fees were tiny, and my NFT reputation follows me across teams.”</div>
                  <div className="text-xs text-provn-muted mt-1">Alex G. · Full‑stack Developer</div>
                </div>
              </div>
            </div>
          </div>

          {/* For Teams */}
          <div className="bg-provn-surface/70 backdrop-blur-sm border border-provn-border/40 rounded-2xl p-6">
            <div className="mb-3">
              <ProvnBadge className="bg-provn-success/10 text-provn-success border-provn-success/20">For Teams</ProvnBadge>
            </div>
            <h3 className="text-provn-text font-semibold mb-3">Benefit highlights</h3>
            <ul className="list-disc list-inside text-provn-text/90 space-y-1">
              <li>Pay-as-you-build transparency, reduced fraud, no payroll hassle.</li>
            </ul>
            <div className="mt-5 p-4 rounded-xl border border-provn-border/40 bg-provn-surface/70">
              <div className="text-xs text-provn-muted mb-2">Targets (not claims)</div>
              <div className="flex flex-wrap gap-3 items-center">
                <span className="px-3 py-1.5 rounded-full bg-provn-surface-2 border border-provn-border/40 text-sm text-provn-text">&lt;2s processing</span>
                <span className="px-3 py-1.5 rounded-full bg-provn-surface-2 border border-provn-border/40 text-sm text-provn-text">99.9% uptime target</span>
                <span className="px-3 py-1.5 rounded-full bg-provn-surface-2 border border-provn-border/40 text-sm text-provn-text">Zero critical incidents</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Roadmap / Milestones */}
      <section className="py-24 bg-provn-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6">
               Milestones
            </h2>
            <p className="text-xl text-provn-success max-w-3xl mx-auto">
              M1–M4 highlights
            </p>
          </motion.div>

          {/* M1–M4 Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.0 }}
              viewport={{ once: true }}
              className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20">M1</ProvnBadge>
                
              </div>
              <div className="text-provn-text font-semibold">Mainnet launch</div>
              <div className="text-sm text-provn-muted mt-1">Payments streaming live, core payouts, creator onboarding.</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20">M2</ProvnBadge>
                
              </div>
              <div className="text-provn-text font-semibold">AI multi‑language</div>
              <div className="text-sm text-provn-muted mt-1">Code verification across major languages and frameworks.</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20">M3</ProvnBadge>
               
              </div>
              <div className="text-provn-text font-semibold">NFT + marketplace</div>
              <div className="text-sm text-provn-muted mt-1">Portable reputation NFTs and a marketplace for verified work.</div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20">M4</ProvnBadge>
               
              </div>
              <div className="text-provn-text font-semibold">L2 + enterprise features</div>
              <div className="text-sm text-provn-muted mt-1">Cheaper L2, multi‑sig, bulk payouts, and admin APIs.</div>
            </motion.div>
          </div>

          {/* Comparison Table (hidden) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="hidden bg-provn-surface border border-provn-border rounded-2xl overflow-hidden max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-4 bg-provn-surface-2 p-4">
              <div className="font-headline font-bold text-provn-text">Platform</div>
              <div className="font-headline font-bold text-provn-text text-center">Platform Cut</div>
              <div className="font-headline font-bold text-provn-text text-center">Creator Gets</div>
              <div className="font-headline font-bold text-provn-text text-center">$1000 Revenue</div>
            </div>
            
            {[
              { platform: "YouTube", cut: "45%", creator: "55%", amount: "$550", color: "red" },
              { platform: "TikTok", cut: "50%", creator: "50%", amount: "$500", color: "purple" },
              { platform: "Instagram", cut: "35%", creator: "65%", amount: "$650", color: "pink" },
              { platform: "Provn", cut: "0%", creator: "100%", amount: "$1000", color: "accent", highlight: true }
            ].map((row) => (
              <div key={row.platform} className={`grid grid-cols-4 p-4 border-t border-provn-border ${row.highlight ? 'bg-provn-accent/5' : ''}`}>
                <div className={`font-semibold ${row.highlight ? 'text-provn-accent' : 'text-provn-text'}`}>
                  {row.platform}
                </div>
                <div className={`text-center ${row.color === 'accent' ? 'text-provn-success font-bold' : 'text-red-400'}`}>
                  {row.cut}
                </div>
                <div className={`text-center ${row.color === 'accent' ? 'text-provn-success font-bold' : 'text-provn-muted'}`}>
                  {row.creator}
                </div>
                <div className={`text-center font-bold ${row.color === 'accent' ? 'text-provn-accent text-lg' : 'text-provn-text'}`}>
                  {row.amount}
                </div>
              </div>
            ))}
          </motion.div>
          
          
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20">Pricing</ProvnBadge>
          <h2 className="mt-4 font-headline text-4xl md:text-6xl font-bold text-provn-text">Simple, transparent pricing</h2>
          <p className="text-xl text-provn-muted mt-3">Creators get paid fast. Teams scale with confidence.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creator / Standard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-provn-border/40 bg-provn-surface/70 p-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-provn-text text-xl font-semibold">Standard</h3>
              <ProvnBadge className="bg-provn-success/10 text-provn-success border-provn-success/20">Live</ProvnBadge>
            </div>
            <div className="mt-4 text-5xl font-bold text-provn-text">2.5%</div>
            <div className="text-provn-muted">platform fee</div>
            <ul className="mt-6 space-y-2 text-provn-text/90">
              <li>• Real-time USDC streaming</li>
              <li>• AI code verification</li>
              <li>• Portable reputation NFTs</li>
            </ul>
          </motion.div>

          {/* Enterprise */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-provn-border/40 bg-provn-surface/70 p-8"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-provn-text text-xl font-semibold">Enterprise</h3>
              <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20">Custom</ProvnBadge>
            </div>
            <div className="mt-4 text-5xl font-bold text-provn-text">Custom</div>
            <div className="text-provn-muted">SLAs, bulk payments</div>
            <ul className="mt-6 space-y-2 text-provn-text/90">
              <li>• Multi-sig + admin APIs</li>
              <li>• Bulk payouts and approvals</li>
              <li>• Dedicated support & SSO</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <ProvnBadge className="bg-provn-accent/10 text-provn-accent border-provn-accent/20">FAQ</ProvnBadge>
          <h2 className="mt-4 font-headline text-4xl md:text-6xl font-bold text-provn-text">Frequently asked</h2>
          <p className="text-xl text-provn-muted mt-3 max-w-3xl mx-auto">How streams work, wallets, custody/compliance, chains, accuracy, and gas fees.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
          >
            <div className="text-provn-text font-semibold mb-2">How do streams work?</div>
            <div className="text-provn-muted text-sm">We stream Payments per-second to your address or custodial account. Balances accrue continuously; you can withdraw anytime.</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            viewport={{ once: true }}
            className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
          >
            <div className="text-provn-text font-semibold mb-2">Do I need a wallet?</div>
            <div className="text-provn-muted text-sm">No. Use a self‑custody wallet, or start with a managed (custodial) wallet and switch later—your earnings and reputation stay with you.</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
          >
            <div className="text-provn-text font-semibold mb-2">Custody & compliance?</div>
            <div className="text-provn-muted text-sm">We support non‑custodial flows and compliant custodial partners. KYC/AML is handled when enterprise payouts require it.</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            viewport={{ once: true }}
            className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
          >
            <div className="text-provn-text font-semibold mb-2">What chains?</div>
            <div className="text-provn-muted text-sm">Mainnet at launch; L2 support on roadmap. We choose low‑latency, low‑fee networks for streaming reliability.</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
          >
            <div className="text-provn-text font-semibold mb-2">How is accuracy measured?</div>
            <div className="text-provn-muted text-sm">AI code verification is benchmarked on labeled datasets across languages; we report target accuracy (~95%) and regressions per model update.</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            viewport={{ once: true }}
            className="bg-provn-surface/70 border border-provn-border/40 rounded-2xl p-6"
          >
            <div className="text-provn-text font-semibold mb-2">Gas fees?</div>
            <div className="text-provn-muted text-sm">We batch and net‑settle streams to minimize gas. On L2, costs are cents; on Mainnet, fees are amortized across the stream window.</div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 text-center bg-gradient-to-r from-provn-accent/5 via-provn-accent/10 to-provn-accent/5">
        <div className="max-w-4xl mx-auto space-y-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="font-headline text-4xl md:text-6xl font-bold text-provn-text mb-6">
              Build the future of developer work.
            </h2>
            <p className="text-xl text-provn-muted mb-8 max-w-2xl mx-auto">
              Join thousands of developers who've taken control of their content and are earning more than ever before.
            </p>
            
            {/* Email sign-up (enhanced) */}
            <div className="mt-8 max-w-2xl mx-auto w-full">
              <form
                onSubmit={(e) => { e.preventDefault(); alert('Thanks! We\'ll be in touch.'); }}
                className="group relative"
              >
                <div className="p-[1px] rounded-2xl bg-gradient-to-r from-provn-accent/40 via-provn-accent/20 to-provn-accent/40">
                  <div className="flex items-center gap-2 bg-provn-bg rounded-2xl p-1.5 sm:p-2 border border-provn-border/40 focus-within:border-provn-accent/60 transition-colors">
                    <div className="pl-3 sm:pl-4 flex items-center">
                      <Mail className="w-5 h-5 text-provn-muted" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="Enter your email"
                      aria-label="Email address"
                      className="flex-1 bg-transparent px-3 py-2 text-provn-text placeholder:text-provn-muted focus:outline-none"
                    />
                    <ProvnButton type="submit" className="px-5 py-2 sm:px-6 sm:py-3">Join waitlist</ProvnButton>
                  </div>
                </div>
              </form>
              <p className="text-sm text-provn-muted mt-3 text-center">No spam. Unsubscribe anytime.</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 pt-8"
          >
            <ProvnBadge variant="success" className="text-sm px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-1" />
              Streaming
            </ProvnBadge>
            <ProvnBadge variant="success" className="text-sm px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-1" />
              Verified
            </ProvnBadge>
            <ProvnBadge variant="success" className="text-sm px-4 py-2">
              <CheckCircle className="w-4 h-4 mr-1" />
              Portable
            </ProvnBadge>
           
          </motion.div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative py-20 bg-gradient-to-b from-provn-bg to-provn-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center space-y-12"
          >
            {/* Dominant Logo */}
            <div className="flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo"
                width={200}
                height={200}
                className="h-24 w-auto md:h-28 lg:h-32"
                priority
              />
            </div>

            {/* Bold Statement */}
            <div className="space-y-4">
              <h3 className="font-headline text-2xl md:text-3xl font-bold text-provn-text leading-tight">
                The future of creator economics
              </h3>
              <p className="text-lg text-provn-muted max-w-2xl mx-auto">
                True ownership. Built for creators who demand more.
              </p>
            </div>

            {/* Elegant Attribution */}
            <div className="pt-8 border-t border-provn-border/20 space-y-4">
              {/* Footer Links */}
              <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <a href="/docs" className="text-provn-muted hover:text-provn-text transition-colors">Docs</a>
                <a href="/security" className="text-provn-muted hover:text-provn-text transition-colors">Security</a>
                <a href="/status" className="text-provn-muted hover:text-provn-text transition-colors">Status</a>
                <a href="/careers" className="text-provn-muted hover:text-provn-text transition-colors">Careers</a>
                <a href="/legal" className="text-provn-muted hover:text-provn-text transition-colors">Legal</a>
                <a href="/social" className="text-provn-muted hover:text-provn-text transition-colors">Social</a>
              </nav>

              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 text-provn-muted">
                <div className="text-sm">
                  2024 Growstreams — All rights reserved
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Crafted for</span>
                  <a 
                    href="https://x.com/campnetworkxyz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-provn-accent font-semibold hover:text-provn-accent/80 transition-colors cursor-pointer"
                  >
                    GrowStreams
                  </a>
                  
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  )
}