'use client';

import { Shield, AlertTriangle, Trophy, CheckCircle2, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { VaraWallet } from '@/components/provn/VaraWallet';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-provn-bg text-provn-text">
      {/* Header */}
      <header className="border-b border-provn-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-provn-accent">
            GrowStreams
          </Link>
          <VaraWallet />
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 border-b border-provn-border bg-gradient-to-b from-provn-surface to-provn-bg">
        <div className="container mx-auto max-w-4xl text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-provn-accent" />
          <h1 className="text-5xl font-bold mb-4">Campaign Rules & FAQ</h1>
          <p className="text-xl text-provn-muted">
            Everything you need to know to participate fairly
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl space-y-8">
          
          {/* Eligibility */}
          <div className="bg-provn-surface rounded-lg border border-provn-border p-8">
            <div className="flex items-start gap-4 mb-4">
              <CheckCircle2 className="w-8 h-8 text-provn-success flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-4">Eligibility</h2>
                <ul className="space-y-3 text-provn-muted">
                  <li className="flex gap-2">
                    <span className="text-provn-accent">•</span>
                    <span>Must have a Vara wallet and GitHub account</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-provn-accent">•</span>
                    <span>Complete Reclaim Protocol verification to prove GitHub ownership</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-provn-accent">•</span>
                    <span>Only contributions from the campaign window (last 30 days) count</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-provn-accent">•</span>
                    <span>Must mint Scorecard NFT and share on X to be eligible for prizes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-provn-accent">•</span>
                    <span>One entry per person; duplicate accounts will be disqualified</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Anti-Gaming Rules */}
          <div className="bg-provn-surface rounded-lg border border-provn-accent p-8">
            <div className="flex items-start gap-4 mb-4">
              <AlertTriangle className="w-8 h-8 text-provn-accent flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-4">Anti-Gaming Rules</h2>
                <ul className="space-y-3 text-provn-muted">
                  <li className="flex gap-2">
                    <span className="text-provn-error">×</span>
                    <span><strong>No spam PRs:</strong> Low-quality contributions (typo fixes, whitespace changes) are downweighted</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-provn-error">×</span>
                    <span><strong>No fake repos:</strong> Contributions to self-created or low-activity repos receive minimal scores</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-provn-error">×</span>
                    <span><strong>No bot activity:</strong> Automated commits detected via patterns will be filtered out</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-provn-error">×</span>
                    <span><strong>One prize per human:</strong> Multiple wallets with suspicious similarity will be investigated</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-provn-error">×</span>
                    <span><strong>Manual review:</strong> Top 10 entries undergo manual verification before prizes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Scoring System */}
          <div className="bg-provn-surface rounded-lg border border-provn-border p-8">
            <div className="flex items-start gap-4 mb-4">
              <Trophy className="w-8 h-8 text-provn-accent flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-4">How Scoring Works</h2>
                <div className="space-y-4 text-provn-muted">
                  <div>
                    <h3 className="font-semibold text-provn-text mb-2">Overall Score (0-100)</h3>
                    <p>Weighted average of all category scores based on contribution activity</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-provn-text mb-2">Impact Score</h3>
                    <p>Lines changed, files modified, repo popularity, community engagement</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-provn-text mb-2">Quality Score</h3>
                    <p>Code review approval rate, test coverage, documentation completeness</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-provn-text mb-2">Collaboration Score</h3>
                    <p>PR reviews given, issues discussed, team contributions, cross-repo work</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-provn-text mb-2">Security Score</h3>
                    <p>Security patches, vulnerability fixes, dependency updates, security best practices</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Prize Distribution */}
          <div className="bg-provn-surface rounded-lg border border-provn-border p-8">
            <h2 className="text-2xl font-bold mb-4">Prize Distribution</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-provn-border pb-3">
                <span className="font-semibold">Grand Prize (Highest Overall)</span>
                <span className="text-provn-accent font-bold">$1,000 USDC</span>
              </div>
              <div className="flex justify-between items-center border-b border-provn-border pb-3">
                <span className="font-semibold">Highest Impact</span>
                <span className="text-provn-accent font-bold">$300 USDC</span>
              </div>
              <div className="flex justify-between items-center border-b border-provn-border pb-3">
                <span className="font-semibold">Highest Quality</span>
                <span className="text-provn-accent font-bold">$300 USDC</span>
              </div>
              <div className="flex justify-between items-center border-b border-provn-border pb-3">
                <span className="font-semibold">Highest Collaboration</span>
                <span className="text-provn-accent font-bold">$300 USDC</span>
              </div>
              <div className="flex justify-between items-center border-b border-provn-border pb-3">
                <span className="font-semibold">Highest Security</span>
                <span className="text-provn-accent font-bold">$300 USDC</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Community Pick (Most Retweets, Score ≥70)</span>
                <span className="text-provn-accent font-bold">$200 USDC</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-provn-muted italic">
              * Winners announced within 48 hours of campaign close. Payouts sent to Vara wallet addresses.
            </p>
          </div>

          {/* FAQ */}
          <div className="bg-provn-surface rounded-lg border border-provn-border p-8">
            <div className="flex items-start gap-4 mb-6">
              <HelpCircle className="w-8 h-8 text-provn-accent flex-shrink-0" />
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-provn-text">Can I participate if I just started coding?</h3>
                <p className="text-provn-muted">Yes! Quality matters more than quantity. Even small but meaningful contributions can score well.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-provn-text">Do private repos count?</h3>
                <p className="text-provn-muted">No, only public GitHub contributions are analyzed to ensure transparency.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-provn-text">What if I don't have a Vara wallet?</h3>
                <p className="text-provn-muted">You can install SubWallet, Talisman, or Polkadot.js extension to create a Vara-compatible wallet.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-provn-text">Can I win multiple category prizes?</h3>
                <p className="text-provn-muted">No, each participant can win only one prize. If you rank #1 in multiple categories, you receive the highest value prize.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-provn-text">How is the CID generated?</h3>
                <p className="text-provn-muted">Your analysis report is uploaded to IPFS, and the Content Identifier (CID) is stored in your NFT metadata for verifiability.</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-provn-text">What happens if I don't share on X?</h3>
                <p className="text-provn-muted">You won't appear on the public leaderboard and won't be eligible for prizes. Sharing is required to participate.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-8">
            <Link
              href="/campaign"
              className="inline-block px-8 py-4 bg-provn-accent hover:bg-provn-accent-press rounded-lg font-bold text-lg transition-colors mb-4"
            >
              Start Your Journey
            </Link>
            <p className="text-sm text-provn-muted">
              Questions? Contact us at{' '}
              <a href="mailto:support@growstreams.app" className="text-provn-accent hover:underline">
                support@growstreams.app
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
