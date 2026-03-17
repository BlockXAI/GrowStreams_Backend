'use client';

import { Loader2, CheckCircle2, XCircle, Code2, GitBranch, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisProgressProps {
  status: 'idle' | 'fetching' | 'analyzing' | 'calculating' | 'complete' | 'error';
  currentStep?: string;
  progress?: number;
  username?: string;
  error?: string;
}

const STEPS = [
  { key: 'fetching', label: 'Fetching GitHub data', icon: GitBranch },
  { key: 'analyzing', label: 'Analyzing repositories', icon: Code2 },
  { key: 'calculating', label: 'Calculating Web3 scores', icon: Sparkles },
  { key: 'complete', label: 'Analysis complete', icon: CheckCircle2 },
];

export function AnalysisProgress({ 
  status, 
  currentStep, 
  progress = 0,
  username,
  error 
}: AnalysisProgressProps) {
  if (status === 'idle') return null;

  const getCurrentStepIndex = () => {
    const index = STEPS.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="bg-provn-surface border border-provn-border rounded-2xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <AnimatePresence mode="wait">
          {status === 'error' ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-500 mb-2">Analysis Failed</h3>
              <p className="text-sm text-provn-muted">{error || 'Something went wrong. Please try again.'}</p>
            </motion.div>
          ) : status === 'complete' ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-500 mb-2">Analysis Complete!</h3>
              <p className="text-sm text-provn-muted">Your Web3 scorecard is ready</p>
            </motion.div>
          ) : (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-16 h-16 text-provn-accent mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-provn-text mb-2">
                Analyzing {username ? `@${username}` : 'your profile'}
              </h3>
              <p className="text-sm text-provn-muted">This may take 10-30 seconds...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      {!['error', 'idle'].includes(status) && (
        <div className="mb-8">
          <div className="h-2 bg-provn-surface-2 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-provn-accent to-purple-600"
              initial={{ width: '0%' }}
              animate={{ 
                width: status === 'complete' ? '100%' : `${((currentIndex + 1) / STEPS.length) * 100}%` 
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      {status !== 'error' && (
        <div className="space-y-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex || status === 'complete';
            const isPending = index > currentIndex && status !== 'complete';

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isActive 
                    ? 'bg-provn-accent/10 border-provn-accent/50' 
                    : isComplete
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-provn-surface-2 border-provn-border/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isActive
                    ? 'bg-provn-accent text-provn-bg'
                    : isComplete
                    ? 'bg-green-500 text-white'
                    : 'bg-provn-surface-3 text-provn-muted'
                }`}>
                  {isActive ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1">
                  <div className={`font-semibold ${
                    isActive ? 'text-provn-accent' : isComplete ? 'text-green-500' : 'text-provn-muted'
                  }`}>
                    {step.label}
                  </div>
                  {isActive && currentStep && (
                    <div className="text-xs text-provn-muted mt-1">{currentStep}</div>
                  )}
                </div>

                {isComplete && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-500"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ETA */}
      {!['error', 'complete', 'idle'].includes(status) && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-provn-surface-2 rounded-full text-sm text-provn-muted">
            <TrendingUp className="w-4 h-4" />
            <span>Estimated time: {Math.max(10, 30 - (currentIndex * 8))}s remaining</span>
          </div>
        </div>
      )}
    </div>
  );
}
