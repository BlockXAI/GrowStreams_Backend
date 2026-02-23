'use client';

import { TierBadge } from './TierBadge';
import { Github, Award, Shield, Users, Code2, Star, GitFork, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Web3Scores {
  overall_web3: number;
  impact: number;
  quality: number;
  collaboration: number;
  security: number;
}

interface EcosystemBreakdown {
  web3?: number;
  ai?: number;
  blockchain?: number;
  devtools?: number;
  total_tech_repos: number;
}

interface RepoContribution {
  name: string;
  trust: number;
  commits: number;
  prs_merged?: number;
  prs_created?: number;
  reviews?: number;
}

interface ScoreCardProps {
  username: string;
  scores: Web3Scores;
  tier: string;
  ecosystems?: EcosystemBreakdown;
  repos?: RepoContribution[];
  bonuses?: string[];
  explanations?: {
    impact?: string;
    quality?: string;
    collaboration?: string;
    security?: string;
  };
  totalCommits?: number;
  totalPRs?: number;
  cid?: string;
}

const COMPONENT_SCORES = [
  { key: 'impact', label: 'Impact', icon: TrendingUp, color: 'from-provn-accent to-purple-600' },
  { key: 'quality', label: 'Quality', icon: Award, color: 'from-blue-500 to-cyan-500' },
  { key: 'collaboration', label: 'Collaboration', icon: Users, color: 'from-green-500 to-emerald-500' },
  { key: 'security', label: 'Security', icon: Shield, color: 'from-orange-500 to-red-500' },
];

export function ScoreCard({
  username,
  scores,
  tier,
  ecosystems,
  repos = [],
  bonuses = [],
  explanations = {},
  totalCommits = 0,
  totalPRs = 0,
  cid,
}: ScoreCardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Github className="w-8 h-8 text-provn-accent" />
          <h2 className="text-3xl font-bold text-provn-text">@{username}</h2>
        </div>
        <TierBadge tier={tier} score={scores.overall_web3} size="lg" />
      </motion.div>

      {/* Overall Score */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-br from-provn-surface/90 to-provn-surface-2/90 border-2 border-provn-accent/50 rounded-3xl p-8 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-provn-accent/5 to-purple-500/5"></div>
        <div className="relative">
          <div className="text-sm text-provn-muted mb-2">Overall Web3 Score</div>
          <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-provn-accent to-purple-600 mb-2">
            {scores.overall_web3}
          </div>
          <div className="text-sm text-provn-muted">out of 100</div>
        </div>
      </motion.div>

      {/* Component Scores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {COMPONENT_SCORES.map((component, index) => {
          const Icon = component.icon;
          const score = scores[component.key as keyof Web3Scores];
          const explanation = explanations[component.key as keyof typeof explanations];

          return (
            <motion.div
              key={component.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-provn-surface border border-provn-border rounded-xl p-4 hover:border-provn-accent/50 transition-all group"
              title={explanation}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${component.color} opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-provn-text" />
                </div>
                <div className="text-2xl font-bold text-provn-text">{score}</div>
              </div>
              <div className="text-sm font-medium text-provn-muted">{component.label}</div>
              <div className="mt-2 h-2 bg-provn-surface-2 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${component.color} transition-all`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Stats Row */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">{totalCommits}</div>
          <div className="text-xs text-provn-muted mt-1">Commits</div>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">{totalPRs}</div>
          <div className="text-xs text-provn-muted mt-1">PRs Merged</div>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">{repos.length}</div>
          <div className="text-xs text-provn-muted mt-1">Repositories</div>
        </div>
        <div className="bg-provn-surface border border-provn-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-provn-text">{ecosystems?.total_tech_repos || 0}</div>
          <div className="text-xs text-provn-muted mt-1">Tech Repos</div>
        </div>
      </motion.div>

      {/* Ecosystems */}
      {ecosystems && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-provn-surface border border-provn-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-provn-text mb-4 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-provn-accent" />
            Ecosystem Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ecosystems.web3 !== undefined && ecosystems.web3 > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-provn-accent">{ecosystems.web3}</div>
                <div className="text-xs text-provn-muted">Web3</div>
              </div>
            )}
            {ecosystems.blockchain !== undefined && ecosystems.blockchain > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-blue-500">{ecosystems.blockchain}</div>
                <div className="text-xs text-provn-muted">Blockchain</div>
              </div>
            )}
            {ecosystems.ai !== undefined && ecosystems.ai > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-purple-500">{ecosystems.ai}</div>
                <div className="text-xs text-provn-muted">AI/ML</div>
              </div>
            )}
            {ecosystems.devtools !== undefined && ecosystems.devtools > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-green-500">{ecosystems.devtools}</div>
                <div className="text-xs text-provn-muted">DevTools</div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Bonuses */}
      {bonuses.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-green-500/10 border border-green-500/30 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-green-500 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Bonuses Applied
          </h3>
          <div className="space-y-2">
            {bonuses.map((bonus, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-provn-text">
                <span className="text-green-500">✓</span>
                <span>{bonus}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Top Repositories */}
      {repos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-provn-surface border border-provn-border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-provn-text mb-4 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-provn-accent" />
            Top Repositories
          </h3>
          <div className="space-y-3">
            {repos.slice(0, 5).map((repo, index) => (
              <div
                key={repo.name}
                className="flex items-center justify-between p-3 bg-provn-surface-2 rounded-lg hover:bg-provn-surface-3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm text-provn-text truncate">{repo.name}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-provn-muted">
                    <span>{repo.commits} commits</span>
                    {repo.prs_merged !== undefined && <span>• {repo.prs_merged} PRs</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <div className="px-2 py-1 bg-provn-accent/10 border border-provn-accent/30 rounded text-xs font-medium text-provn-accent">
                    Trust: {Math.round(repo.trust * 100)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* CID */}
      {cid && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="bg-provn-surface-2 border border-provn-border rounded-xl p-4 text-center"
        >
          <div className="text-xs text-provn-muted mb-1">Analysis CID</div>
          <div className="font-mono text-sm text-provn-accent break-all">{cid}</div>
        </motion.div>
      )}
    </div>
  );
}
