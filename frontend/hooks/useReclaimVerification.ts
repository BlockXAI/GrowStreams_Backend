'use client';

import { useState, useCallback } from 'react';
// The package exports a `Reclaim` class which exposes `ProofRequest` as a static
// member. Use that class and instantiate `Reclaim.ProofRequest` below.
import { Reclaim } from '@reclaimprotocol/js-sdk';
import { useAccount } from '@gear-js/react-hooks';

const APP_ID = process.env.NEXT_PUBLIC_RECLAIM_APP_ID || '';
const APP_SECRET = process.env.NEXT_PUBLIC_RECLAIM_APP_SECRET || '';
const GITHUB_PROVIDER_ID = process.env.NEXT_PUBLIC_RECLAIM_GITHUB_PROVIDER_ID || '';

export interface ReclaimProof {
  claimData: {
    provider: string;
    parameters: string;
    context: string;
  };
  signatures: string[];
  witnesses: Array<{
    id: string;
    url: string;
  }>;
}

export function useReclaimVerification() {
  const { account } = useAccount();
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [proofRequest, setProofRequest] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [proof, setProof] = useState<ReclaimProof | null>(null);
  const [error, setError] = useState<string>('');

  /**
   * Initialize Reclaim proof request for GitHub verification
   */
  const initializeProofRequest = useCallback(async (githubUsername: string) => {
    if (!APP_ID || !APP_SECRET) {
      setError('Reclaim credentials not configured');
      return;
    }

    try {
      setIsGeneratingProof(true);
      setError('');

      // Initialize Reclaim Proof Request via the SDK's ProofRequest constructor
      const reclaimProofRequest = new Reclaim.ProofRequest(APP_ID);

      // Set callback URL
      reclaimProofRequest.setAppCallbackUrl(
        `${window.location.origin}/campaign?verified=true`
      );

      // Add user's address as context
      if (account) {
        reclaimProofRequest.addContext(account.decodedAddress, githubUsername);
      }

      // Generate verification request (returns requestUrl and statusUrl)
      const { requestUrl, statusUrl } = await reclaimProofRequest.createVerificationRequest();

      setProofRequest(reclaimProofRequest as any);
      setQrCodeUrl(requestUrl);

      // Start listening for proof submission using the SDK signatures
      await reclaimProofRequest.startSession({
        onSuccessCallback: (receivedProofs: any) => {
          console.log('Proof received:', receivedProofs);
          // The SDK returns an array of proofs; pick the first (or adapt as needed)
          setProof(receivedProofs && receivedProofs[0] ? receivedProofs[0] : receivedProofs);
          setIsGeneratingProof(false);
        },
        onFailureCallback: (err: Error) => {
          console.error('Proof verification failed:', err);
          setError(err.message);
          setIsGeneratingProof(false);
        },
      });

      return { requestUrl, statusUrl };
    } catch (err) {
      console.error('Error initializing proof request:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize proof request');
      setIsGeneratingProof(false);
      return null;
    }
  }, [account]);

  /**
   * Transform proof for on-chain verification
   */
  const transformProofForContract = useCallback((proof: ReclaimProof) => {
    return {
      claimInfo: {
        provider: proof.claimData.provider,
        parameters: proof.claimData.parameters,
        context: proof.claimData.context,
      },
      signedClaim: {
        claim: {
          identifier: proof.claimData.provider,
          owner: account?.decodedAddress || '',
          timestampS: Math.floor(Date.now() / 1000),
          epoch: 0,
        },
        signatures: proof.signatures,
      },
    };
  }, [account]);

  /**
   * Reset verification state
   */
  const reset = useCallback(() => {
    setProofRequest(null);
    setQrCodeUrl('');
    setProof(null);
    setError('');
    setIsGeneratingProof(false);
  }, []);

  return {
    // State
    isGeneratingProof,
    qrCodeUrl,
    proof,
    error,
    proofRequest,
    
    // Actions
    initializeProofRequest,
    transformProofForContract,
    reset,
    
    // Computed
    isVerified: !!proof,
    isReady: !isGeneratingProof && !!qrCodeUrl,
  };
}
