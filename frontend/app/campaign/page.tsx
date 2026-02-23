'use client';

import { useState } from 'react';
import { useAccount, useApi } from '@gear-js/react-hooks';
import { VaraWallet } from '@/components/provn/VaraWallet';
import { ReclaimVerification } from '@/components/reclaim/ReclaimVerification';
import { AnalysisProgress } from '@/components/campaign/AnalysisProgress';
import { ScoreCard } from '@/components/campaign/ScoreCard';
import { Countdown } from '@/components/campaign/Countdown';
import { PrizeBanner } from '@/components/campaign/PrizeBanner';
import { ShareStrip } from '@/components/campaign/ShareStrip';
import { Github, Award, Share2, CheckCircle2, Clock, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type CampaignStep = 'connect' | 'github' | 'verify' | 'analyze' | 'mint' | 'share' | 'complete';

interface ScoreData {
  overall: number;
  impact: number;
  quality: number;
  collaboration: number;
  security: number;
  cid: string;
}

export default function CampaignPage() {
  const { account } = useAccount();
  const { isApiReady } = useApi();
  
  const [currentStep, setCurrentStep] = useState<CampaignStep>('connect');
  const [githubId, setGithubId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'fetching' | 'analyzing' | 'calculating' | 'complete' | 'error'>('idle');
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [fullAnalysis, setFullAnalysis] = useState<any>(null);
  const [nftMinted, setNftMinted] = useState(false);
  const [reclaimProof, setReclaimProof] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string>('');

  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubId.trim()) {
      toast.error('Please enter your GitHub username');
      return;
    }
    setIsLoading(true);
    // Simulate GitHub verification
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep('verify');
      toast.success('GitHub username saved!');
    }, 1000);
  };

  const handleReclaimVerified = async (proof: any) => {
    setReclaimProof(proof);
    setCurrentStep('analyze');
    toast.success('GitHub ownership verified!');
  };

  const handleReclaimError = (error: string) => {
    toast.error(`Verification failed: ${error}`);
  };

  const handleAnalyze = async () => {
    if (!githubId.trim()) {
      toast.error('GitHub username required');
      return;
    }

    // Step guards - require Reclaim verification
    if (!reclaimProof) {
      toast.error('Please verify your GitHub account first');
      return;
    }

    setIsLoading(true);
    setAnalysisStatus('fetching');
    setAnalysisError('');
    
    try {
      // Simulate progress updates
      setTimeout(() => setAnalysisStatus('analyzing'), 1000);
      setTimeout(() => setAnalysisStatus('calculating'), 5000);

      const response = await fetch('/api/web3/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          github_username: githubId,
          window_days: 180,
          actor_id: account?.decodedAddress,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const analysis = await response.json();

      // Store full analysis
      setFullAnalysis(analysis);

      const scoreData: ScoreData = {
        overall: analysis.scores.overall_web3,
        impact: analysis.scores.impact,
        quality: analysis.scores.quality,
        collaboration: analysis.scores.collaboration,
        security: analysis.scores.security,
        cid: `analysis_${Date.now()}`, // Will be replaced with IPFS CID after upload
      };

      setScoreData(scoreData);
      setAnalysisStatus('complete');
      setCurrentStep('mint');
      toast.success(`Analysis complete! Score: ${scoreData.overall}/100 - Tier: ${analysis.tier}`);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisStatus('error');
      setAnalysisError(error instanceof Error ? error.message : 'Failed to analyze GitHub profile');
      toast.error('Failed to analyze GitHub profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMintNFT = async () => {
    if (!account || !scoreData) {
      toast.error('Please connect wallet and complete analysis');
      return;
    }
    setIsLoading(true);
    // TODO: Call NFT minting contract
    setTimeout(() => {
      setNftMinted(true);
      setIsLoading(false);
      setCurrentStep('share');
      toast.success('NFT Minted Successfully!');
    }, 2000);
  };

  const handleShareOnX = () => {
    if (!scoreData) return;
    const text = encodeURIComponent(
      `I just verified my Web3 contributions on @VaraNetwork!\n` +
      `Score: ${scoreData.overall} | CID: ${scoreData.cid.substring(0, 10)}...\n` +
      `Minted my Scorecard NFT 🎖️\n` +
      `Join the leaderboard → ${window.location.origin}/campaign/leaderboard\n` +
      `#GrowStreamsChallenge #Vara #Web3Builders`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    setCurrentStep('complete');
  };

  const steps = [
    { id: 'connect', label: 'Connect Wallet', icon: Award },
    { id: 'github', label: 'GitHub ID', icon: Github },
    { id: 'verify', label: 'Verify with Reclaim', icon: CheckCircle2 },
    { id: 'analyze', label: 'Run Analysis', icon: Clock },
    { id: 'mint', label: 'Mint NFT', icon: Trophy },
    { id: 'share', label: 'Share on X', icon: Share2 },
  ];

  const getStepIndex = (step: CampaignStep) => {
    const order: CampaignStep[] = ['connect', 'github', 'verify', 'analyze', 'mint', 'share', 'complete'];
    return order.indexOf(step);
  };

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
      <section className="py-12 px-4 text-center border-b border-provn-border bg-gradient-to-b from-provn-surface to-provn-bg">
        <div className="container mx-auto max-w-6xl">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-provn-accent" />
          <h1 className="text-5xl font-bold mb-4">Web3 Contribution Challenge</h1>
          <p className="text-xl text-provn-muted mb-8">
            Verify your GitHub contributions, get scored, mint an NFT, and compete for prizes!
          </p>
          
          {/* Countdown & Prize Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Countdown endsAt="2025-12-01T00:00:00Z" />
            <PrizeBanner compact totalPool="$2,500" />
          </div>

          <div className="flex gap-4 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-provn-accent" />
              <span>Prize Pool: $2,500 USDC</span>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="py-8 px-4 border-b border-provn-border">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = getStepIndex(currentStep) >= index;
              const isCurrent = getStepIndex(currentStep) === index;
              
              return (
                <div key={step.id} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      isActive ? 'bg-provn-accent text-provn-bg' : 'bg-provn-surface-2 text-provn-muted'
                    } ${isCurrent ? 'ring-2 ring-provn-accent ring-offset-2 ring-offset-provn-bg' : ''}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-xs text-center ${isActive ? 'text-provn-text' : 'text-provn-muted'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`absolute top-6 left-1/2 w-full h-0.5 ${
                      isActive ? 'bg-provn-accent' : 'bg-provn-surface-2'
                    }`} style={{ zIndex: -1 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="bg-provn-surface rounded-lg border border-provn-border p-8">
            
            {/* Step 1: Connect Wallet */}
            {currentStep === 'connect' && (
              <div className="text-center">
                <Award className="w-16 h-16 mx-auto mb-4 text-provn-accent" />
                <h2 className="text-2xl font-bold mb-4">Connect Your Vara Wallet</h2>
                <p className="text-provn-muted mb-6">
                  Connect your Vara wallet to participate in the challenge
                </p>
                {!account ? (
                  <div className="flex justify-center">
                    <VaraWallet />
                  </div>
                ) : (
                  <div>
                    <p className="text-provn-success mb-4">✓ Wallet Connected: {account.meta.name}</p>
                    <button
                      onClick={() => setCurrentStep('github')}
                      className="px-6 py-3 bg-provn-accent hover:bg-provn-accent-press rounded-lg font-semibold transition-colors"
                    >
                      Continue to GitHub
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: GitHub ID */}
            {currentStep === 'github' && (
              <div>
                <Github className="w-16 h-16 mx-auto mb-4 text-provn-accent" />
                <h2 className="text-2xl font-bold mb-4 text-center">Enter Your GitHub Username</h2>
                <p className="text-provn-muted mb-6 text-center">
                  We'll analyze your contributions from the last 30 days
                </p>
                <form onSubmit={handleGithubSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">GitHub Username</label>
                    <input
                      type="text"
                      value={githubId}
                      onChange={(e) => setGithubId(e.target.value)}
                      placeholder="octocat"
                      className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg focus:outline-none focus:border-provn-accent"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !githubId.trim()}
                    className="w-full px-6 py-3 bg-provn-accent hover:bg-provn-accent-press disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                  >
                    {isLoading ? 'Saving...' : 'Continue to Verification'}
                  </button>
                </form>
              </div>
            )}

            {/* Step 3: Reclaim Verification */}
            {currentStep === 'verify' && (
              <div>
                <ReclaimVerification
                  githubUsername={githubId}
                  onVerified={handleReclaimVerified}
                  onError={handleReclaimError}
                />
              </div>
            )}

            {/* Step 4: Analysis */}
            {currentStep === 'analyze' && (
              <div>
                {analysisStatus === 'idle' ? (
                  <div className="text-center">
                    <Clock className="w-16 h-16 mx-auto mb-4 text-provn-accent" />
                    <h2 className="text-2xl font-bold mb-4">Analyze Contributions</h2>
                    <p className="text-provn-muted mb-6">
                      We'll analyze your GitHub activity and generate your Web3 Contribution Score
                    </p>
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading || !reclaimProof}
                      className="px-6 py-3 bg-provn-accent hover:bg-provn-accent-press disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                      title={!reclaimProof ? 'Please complete GitHub verification first' : ''}
                    >
                      Run Analysis
                    </button>
                    {!reclaimProof && (
                      <p className="text-sm text-orange-500 mt-4">
                        ⚠️ Please complete GitHub verification before running analysis
                      </p>
                    )}
                  </div>
                ) : (
                  <AnalysisProgress
                    status={analysisStatus}
                    username={githubId}
                    error={analysisError}
                  />
                )}
              </div>
            )}

            {/* Step 5: Mint NFT */}
            {currentStep === 'mint' && scoreData && fullAnalysis && (
              <div>
                <ScoreCard
                  username={githubId}
                  scores={{
                    overall_web3: scoreData.overall,
                    impact: scoreData.impact,
                    quality: scoreData.quality,
                    collaboration: scoreData.collaboration,
                    security: scoreData.security,
                  }}
                  tier={fullAnalysis.tier || 'Beginner'}
                  ecosystems={fullAnalysis.ecosystem_breakdown}
                  repos={fullAnalysis.repo_contributions}
                  bonuses={fullAnalysis.bonuses_applied}
                  explanations={fullAnalysis.explanations}
                  totalCommits={fullAnalysis.commits_made}
                  totalPRs={fullAnalysis.prs_merged}
                  cid={scoreData.cid}
                />

                <div className="mt-8">
                  <button
                    onClick={handleMintNFT}
                    disabled={isLoading || nftMinted}
                    className="w-full px-8 py-4 bg-gradient-to-r from-provn-accent to-purple-600 hover:from-provn-accent-press hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-5 h-5" />
                    {isLoading ? 'Minting...' : nftMinted ? 'NFT Minted ✓' : 'Mint Scorecard NFT'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Share */}
            {currentStep === 'share' && scoreData && fullAnalysis && (
              <div>
                <ShareStrip
                  username={githubId}
                  score={scoreData.overall}
                  tier={fullAnalysis.tier || 'Beginner'}
                  cid={scoreData.cid}
                />
              </div>
            )}

            {/* Step 7: Complete */}
            {currentStep === 'complete' && (
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-provn-success" />
                <h2 className="text-2xl font-bold mb-4">You're All Set!</h2>
                <p className="text-provn-muted mb-6">
                  You're now on the leaderboard and eligible for prizes. Good luck!
                </p>
                
                <div className="space-y-3">
                  <Link
                    href="/campaign/leaderboard"
                    className="block px-6 py-3 bg-provn-accent hover:bg-provn-accent-press rounded-lg font-semibold transition-colors"
                  >
                    View Leaderboard
                  </Link>
                  <Link
                    href="/campaign/rules"
                    className="block px-6 py-3 bg-provn-surface-2 hover:bg-provn-border rounded-lg font-semibold transition-colors"
                  >
                    Read Campaign Rules
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="mt-8 flex gap-4 justify-center text-sm">
            <Link href="/campaign/leaderboard" className="text-provn-accent hover:underline">
              Leaderboard
            </Link>
            <span className="text-provn-border">•</span>
            <Link href="/campaign/rules" className="text-provn-accent hover:underline">
              Rules & FAQ
            </Link>
            <span className="text-provn-border">•</span>
            <Link href="/" className="text-provn-accent hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
