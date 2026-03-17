'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ScoreCard } from '@/components/campaign/ScoreCard';
import { Loader2, AlertCircle, Share2, Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ResultPage() {
  const params = useParams();
  const actorId = params.actorId as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function fetchResult() {
      try {
        setLoading(true);
        const response = await fetch(`/api/result/${actorId}`);
        
        if (!response.ok) {
          throw new Error('Result not found');
        }

        const data = await response.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load result');
      } finally {
        setLoading(false);
      }
    }

    if (actorId) {
      fetchResult();
    }
  }, [actorId]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareOnX = () => {
    if (!result) return;
    
    const text = encodeURIComponent(
      `I just verified my Web3 contributions on @GrowStreams!\n\nScore: ${result.scores.overall_web3}/100 🏆\nTier: ${result.tier}\n\nCheck out my scorecard:`
    );
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-provn-bg flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-provn-accent mx-auto mb-4 animate-spin" />
          <p className="text-provn-muted">Loading scorecard...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-provn-bg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-provn-surface border border-provn-border rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-provn-text mb-2">Scorecard Not Found</h1>
          <p className="text-provn-muted mb-6">
            {error || 'This scorecard does not exist or has been removed.'}
          </p>
          <Link
            href="/campaign"
            className="inline-block px-6 py-3 bg-provn-accent hover:bg-provn-accent-press rounded-lg font-semibold transition-colors"
          >
            Join the Challenge
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      {/* Header */}
      <div className="bg-provn-surface border-b border-provn-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-provn-text">
              GrowStreams
            </Link>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-provn-surface-2 hover:bg-provn-surface-3 border border-provn-border rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={handleShareOnX}
                className="px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] rounded-lg font-medium transition-colors flex items-center gap-2 text-white"
              >
                <Share2 className="w-4 h-4" />
                Share on X
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ScoreCard
          username={result.username}
          scores={{
            overall_web3: result.scores.overall_web3,
            impact: result.scores.impact,
            quality: result.scores.quality,
            collaboration: result.scores.collaboration,
            security: result.scores.security,
          }}
          tier={result.tier}
          ecosystems={result.ecosystem_breakdown}
          repos={result.repo_contributions}
          bonuses={result.bonuses_applied}
          explanations={result.explanations}
          totalCommits={result.commits_made}
          totalPRs={result.prs_merged}
          cid={result.analyzed_at}
        />

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-br from-provn-surface/90 to-provn-surface-2/90 border border-provn-accent/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-provn-text mb-4">
            Want to verify your own contributions?
          </h2>
          <p className="text-provn-muted mb-6">
            Join the Web3 Contribution Challenge and mint your scorecard NFT
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/campaign"
              className="px-8 py-3 bg-gradient-to-r from-provn-accent to-purple-600 hover:from-provn-accent-press hover:to-purple-700 rounded-xl font-semibold text-lg transition-all"
            >
              Join the Challenge
            </Link>
            <Link
              href="/campaign/leaderboard"
              className="px-8 py-3 bg-provn-surface-2 hover:bg-provn-surface-3 border border-provn-border rounded-xl font-semibold transition-colors"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-provn-border mt-16 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-provn-muted">
          <p>Powered by GrowStreams GitHub AI On-Chain Engine • Built on Vara Network</p>
        </div>
      </div>
    </div>
  );
}
