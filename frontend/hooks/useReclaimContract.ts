'use client';

import { useProgram, useSendProgramTransaction } from '@gear-js/react-hooks';
import { useAccount } from '@gear-js/react-hooks';

const RECLAIM_CONTRACT_ID = process.env.NEXT_PUBLIC_RECLAIM_CONTRACT as `0x${string}`;

// TODO: Replace with actual Reclaim contract ABI when deployed
// Cast to any to satisfy the Program typing until a proper ABI object is provided.
const RECLAIM_ABI: any = {};

export function useReclaimContract() {
  const { account } = useAccount();

  // Program instance for Reclaim contract
  const { data: reclaimProgram } = useProgram({
    library: RECLAIM_ABI as any,
    id: RECLAIM_CONTRACT_ID,
  });

  // Verify proof on-chain
  // Cast hook result to any to avoid strict generic constraints from the library types
  const {
    sendTransaction: verifyProof,
    isLoading: isVerifying,
    error: verifyError
  } = (useSendProgramTransaction({
    program: reclaimProgram as any,
    serviceName: 'reclaim' as any,
    functionName: 'verifyProof' as any,
  }) as any);

  /**
   * Submit proof to Reclaim contract for on-chain verification
   */
  const submitProofOnChain = async (transformedProof: any) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const result = await verifyProof({
        // Cast args/value to any to match runtime shape; ABI/types should be tightened later
        args: [transformedProof] as any,
  value: BigInt(0) as any,
      } as any);

      return result;
    } catch (error) {
      console.error('Error verifying proof on-chain:', error);
      throw error;
    }
  };

  return {
    submitProofOnChain,
    isVerifying,
    verifyError,
    isConnected: !!account,
  };
}
