'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Twitter } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ShareStripProps {
  username: string;
  score: number;
  tier: string;
  resultUrl?: string;
  cid?: string;
}

export function ShareStrip({ 
  username, 
  score, 
  tier, 
  resultUrl,
  cid 
}: ShareStripProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = resultUrl || (typeof window !== 'undefined' ? window.location.href : '');
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareOnX = () => {
    const text = encodeURIComponent(
      `🎯 I just verified my Web3 contributions on @GrowStreams!\n\n` +
      `Score: ${score}/100 🏆\n` +
      `Tier: ${tier}\n` +
      `GitHub: @${username}\n\n` +
      `Powered by @VaraNetwork\n\n` +
      `#GrowStreamsChallenge #Web3Builders #Vara`
    );
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'width=550,height=420'
    );
  };

  const handleShareOnLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      '_blank',
      'width=550,height=420'
    );
  };

  return (
    <div className="bg-provn-surface border border-provn-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Share2 className="w-5 h-5 text-provn-accent" />
        <h3 className="text-lg font-semibold text-provn-text">Share Your Achievement</h3>
      </div>

      {/* Preview Card */}
      <div className="bg-provn-surface-2 border border-provn-border rounded-lg p-4 mb-6">
        <div className="text-sm space-y-2">
          <p className="text-provn-text">
            🎯 I just verified my Web3 contributions on @GrowStreams!
          </p>
          <p className="text-provn-text">
            <strong>Score:</strong> {score}/100 🏆 | <strong>Tier:</strong> {tier}
          </p>
          <p className="text-provn-text">
            <strong>GitHub:</strong> @{username}
          </p>
          {cid && (
            <p className="text-xs text-provn-muted font-mono">
              CID: {cid.substring(0, 20)}...
            </p>
          )}
          <p className="text-provn-accent text-xs">
            #GrowStreamsChallenge #Web3Builders #Vara
          </p>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShareOnX}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white rounded-lg font-medium transition-colors"
        >
          <Twitter className="w-4 h-4" />
          Share on X
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShareOnLinkedIn}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
          LinkedIn
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-provn-surface-2 hover:bg-provn-surface-3 border border-provn-border text-provn-text rounded-lg font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </motion.button>
      </div>

      {/* Additional Actions */}
      <div className="mt-4 pt-4 border-t border-provn-border flex justify-center">
        <a
          href="/campaign/leaderboard"
          className="text-sm text-provn-accent hover:text-provn-accent-press font-medium inline-flex items-center gap-2"
        >
          <Trophy className="w-4 h-4" />
          View Your Rank on Leaderboard →
        </a>
      </div>
    </div>
  );
}

function Trophy({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}
