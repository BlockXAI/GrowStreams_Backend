'use client';

import { useState, useEffect, useRef } from 'react';
import { QrCode, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useReclaimVerification } from '@/hooks/useReclaimVerification';
import QRCode from 'qrcode';

interface ReclaimVerificationProps {
  githubUsername: string;
  onVerified: (proof: any) => void;
  onError?: (error: string) => void;
}

export function ReclaimVerification({ 
  githubUsername, 
  onVerified,
  onError 
}: ReclaimVerificationProps) {
  const {
    isGeneratingProof,
    qrCodeUrl,
    proof,
    error,
    initializeProofRequest,
    isVerified,
    isReady,
  } = useReclaimVerification();

  const [isInitialized, setIsInitialized] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code on canvas when URL changes
  useEffect(() => {
    if (qrCodeUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrCodeUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) console.error('QR Code generation error:', error);
      });
    }
  }, [qrCodeUrl]);

  useEffect(() => {
    if (!isInitialized && githubUsername) {
      initializeProofRequest(githubUsername);
      setIsInitialized(true);
    }
  }, [githubUsername, isInitialized, initializeProofRequest]);

  useEffect(() => {
    if (proof) {
      onVerified(proof);
    }
  }, [proof, onVerified]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <h3 className="text-lg font-semibold mb-2 text-red-500">Verification Error</h3>
        <p className="text-sm text-provn-muted mb-4">{error}</p>
        <button
          onClick={() => {
            setIsInitialized(false);
            initializeProofRequest(githubUsername);
          }}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-3 text-green-500" />
        <h3 className="text-xl font-bold mb-2 text-green-500">GitHub Verified!</h3>
        <p className="text-provn-muted">
          Successfully verified ownership of <span className="font-mono text-provn-accent">@{githubUsername}</span>
        </p>
      </div>
    );
  }

  if (isGeneratingProof || !isReady) {
    return (
      <div className="bg-provn-surface border border-provn-border rounded-lg p-8 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-provn-accent animate-spin" />
        <h3 className="text-lg font-semibold mb-2">Generating Proof Request...</h3>
        <p className="text-sm text-provn-muted">Please wait while we set up your verification</p>
      </div>
    );
  }

  return (
    <div className="bg-provn-surface border border-provn-border rounded-lg p-8">
      <div className="text-center mb-6">
        <QrCode className="w-12 h-12 mx-auto mb-3 text-provn-accent" />
        <h3 className="text-xl font-bold mb-2">Verify GitHub Ownership</h3>
        <p className="text-sm text-provn-muted">
          Scan the QR code with your mobile device to verify ownership of{' '}
          <span className="font-mono text-provn-accent">@{githubUsername}</span>
        </p>
      </div>

      {/* QR Code */}
      <div className="bg-white p-6 rounded-lg mb-6 flex justify-center">
        {qrCodeUrl ? (
          <canvas 
            ref={canvasRef}
            className="max-w-full h-auto"
          />
        ) : (
          <div className="w-64 h-64 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-provn-accent text-provn-bg flex items-center justify-center flex-shrink-0 font-bold">
            1
          </div>
          <p className="text-provn-muted">
            Install the Reclaim Wallet app on your mobile device if you haven't already
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-provn-accent text-provn-bg flex items-center justify-center flex-shrink-0 font-bold">
            2
          </div>
          <p className="text-provn-muted">
            Scan the QR code above with the Reclaim Wallet app
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-provn-accent text-provn-bg flex items-center justify-center flex-shrink-0 font-bold">
            3
          </div>
          <p className="text-provn-muted">
            Complete the GitHub verification process in the app
          </p>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-provn-accent text-provn-bg flex items-center justify-center flex-shrink-0 font-bold">
            4
          </div>
          <p className="text-provn-muted">
            Wait for the verification to complete (this page will update automatically)
          </p>
        </div>
      </div>

      {/* Alternative Link */}
      {qrCodeUrl && (
        <div className="mt-6 pt-6 border-t border-provn-border text-center">
          <p className="text-sm text-provn-muted mb-3">Can't scan the QR code?</p>
          <a
            href={qrCodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-provn-surface-2 hover:bg-provn-surface-3 rounded-lg text-sm font-medium transition-colors"
          >
            Open in Reclaim Wallet
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {/* Loading State */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-provn-muted">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Waiting for verification...</span>
      </div>
    </div>
  );
}
