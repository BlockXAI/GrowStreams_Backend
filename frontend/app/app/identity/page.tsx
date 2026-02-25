'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import { api, type BindingData } from '@/lib/growstreams-api';
import { useIdentityActions } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import { Fingerprint, RefreshCw, Github, Link2 } from 'lucide-react';

export default function IdentityPage() {
  const { account } = useAccount();
  const { bindIdentity, loading: signing } = useIdentityActions();
  const [binding, setBinding] = useState<BindingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [githubUsername, setGithubUsername] = useState('');
  const [proofHash, setProofHash] = useState('');
  const [score, setScore] = useState('');

  const loadBinding = async () => {
    if (!account?.decodedAddress) return;
    setLoading(true);
    setNotFound(false);
    try {
      const hex = account.decodedAddress;
      const data = await api.identity.getBinding(hex);
      setBinding(data);
    } catch {
      setNotFound(true);
      setBinding(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBinding();
  }, [account]);

  const handleBind = async (e: FormEvent) => {
    e.preventDefault();
    if (!account?.decodedAddress) return;
    try {
      const hex = account.decodedAddress;
      await bindIdentity(hex, githubUsername, proofHash, Number(score));
      toast.success('Identity bound successfully!');
      setGithubUsername('');
      setProofHash('');
      setScore('');
      setTimeout(loadBinding, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Binding failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Fingerprint className="w-6 h-6 text-cyan-400" /> Identity
          </h1>
          <p className="text-provn-muted text-sm mt-1">Bind your GitHub identity to your Vara account</p>
        </div>
        <button onClick={loadBinding} className="p-2 rounded-lg border border-provn-border hover:bg-provn-surface transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
        </div>
      ) : binding ? (
        <div className="bg-provn-surface border border-provn-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Github className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Identity Bound</h2>
              <p className="text-provn-muted text-sm flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" /> Linked to Vara account
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-provn-border/50">
              <span className="text-sm text-provn-muted">Actor ID</span>
              <span className="text-sm font-mono truncate max-w-[60%]">{binding.actor_id}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-provn-border/50">
              <span className="text-sm text-provn-muted">GitHub Hash</span>
              <span className="text-sm font-mono truncate max-w-[60%]">{binding.github_username_hash}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-provn-border/50">
              <span className="text-sm text-provn-muted">Score</span>
              <span className="text-sm font-bold text-cyan-400">{binding.score}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-provn-border/50">
              <span className="text-sm text-provn-muted">Verified At</span>
              <span className="text-sm">{new Date(binding.verified_at * 1000).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-provn-muted">Last Updated</span>
              <span className="text-sm">{new Date(binding.updated_at * 1000).toLocaleString()}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {notFound && (
            <div className="bg-provn-surface border border-provn-border rounded-xl p-6 text-center">
              <Fingerprint className="w-12 h-12 mx-auto mb-3 text-provn-muted opacity-30" />
              <p className="text-provn-muted mb-1">No identity binding found for this account.</p>
              <p className="text-provn-muted text-sm">Bind your GitHub below to get started.</p>
            </div>
          )}

          <form onSubmit={handleBind} className="bg-provn-surface border border-provn-border rounded-xl p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Github className="w-5 h-5" /> Bind GitHub Identity
            </h2>
            {account?.decodedAddress && (
              <div className="bg-provn-bg/50 rounded-lg px-3 py-2 text-xs">
                <span className="text-provn-muted">Binding to wallet: </span>
                <span className="font-mono text-cyan-400">{account.decodedAddress.slice(0, 10)}...{account.decodedAddress.slice(-6)}</span>
              </div>
            )}
            <div>
              <label className="block text-xs text-provn-muted mb-1">GitHub Username</label>
              <input
                value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} required
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-cyan-500/50 focus:outline-none"
                placeholder="e.g. octocat"
              />
            </div>
            <div>
              <label className="block text-xs text-provn-muted mb-1">Proof Hash (hex)</label>
              <input
                value={proofHash} onChange={(e) => setProofHash(e.target.value)} required
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm font-mono focus:border-cyan-500/50 focus:outline-none"
                placeholder="e.g. a1b2c3d4e5f6..."
              />
              <p className="text-xs text-provn-muted mt-1">Hex-encoded proof of GitHub ownership (from Reclaim or manual verification)</p>
            </div>
            <div>
              <label className="block text-xs text-provn-muted mb-1">Initial Score (0-100)</label>
              <input
                value={score} onChange={(e) => setScore(e.target.value)} required type="number" min="0" max="100"
                className="w-full px-3 py-2 bg-provn-bg border border-provn-border rounded-lg text-sm focus:border-cyan-500/50 focus:outline-none"
                placeholder="50"
              />
              <p className="text-xs text-provn-muted mt-1">AI-assessed quality score for this identity</p>
            </div>
            <button
              type="submit" disabled={signing}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {signing ? 'Signing...' : 'Bind Identity'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
