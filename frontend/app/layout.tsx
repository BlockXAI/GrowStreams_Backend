import type { Metadata } from "next"
import { Space_Grotesk, JetBrains_Mono } from "next/font/google"
import Script from "next/script"
import "./globals.css"

import Providers from "@/components/providers"

const spaceGrotesk = Space_Grotesk({
  display: "swap",
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  display: "swap",
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "GrowStreams — Vara-native Money Streaming Protocol",
  description:
    "GrowStreams is a generalized token streaming protocol on Vara. Per-second payments for bounties, payroll, subscriptions, revenue share, grants, and more.",
  openGraph: {
    title: "GrowStreams — Vara-native Money Streaming Protocol",
    description:
      "Per-second token streaming on Vara. Bounties, payroll, subscriptions, revenue share — all powered by real-time streams.",
    url: "https://growstreams.app",
    siteName: "GrowStreams",
    images: [
      { url: "/logo.png", width: 1200, height: 630, alt: "GrowStreams Protocol" },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowStreams — Vara-native Money Streaming Protocol",
    description:
      "Per-second token streaming on Vara. Bounties, payroll, subscriptions, revenue share — composable, token-agnostic, real-time.",
    images: ["/logo.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} dark`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <Script
        src="https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js"
        strategy="afterInteractive"
      />
      <Script id="ethers-fallback" strategy="afterInteractive">{`
        window.addEventListener('load', function() {
          if (typeof window.ethers === 'undefined') {
            var s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/ethers/5.7.2/ethers.umd.min.js';
            s.onload = function() { window.dispatchEvent(new CustomEvent('ethersLoaded')); };
            document.head.appendChild(s);
          } else {
            window.dispatchEvent(new CustomEvent('ethersLoaded'));
          }
        });
      `}</Script>
      <body className="bg-provn-bg text-provn-text antialiased" suppressHydrationWarning={true}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
