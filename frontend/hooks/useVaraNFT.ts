'use client';

import { useProgram, useSendProgramTransaction } from '@gear-js/react-hooks';
import { useAccount } from '@gear-js/react-hooks';

const NFT_CONTRACT_ID = process.env.NEXT_PUBLIC_VARA_NFT_CONTRACT as `0x${string}`;

// TODO: Replace with actual NFT contract ABI when available
// Cast to any to satisfy the Program typing until a proper ABI object is provided.
const NFT_ABI: any = {};

export function useVaraNFT() {
  const { account } = useAccount();

  // Program instance for NFT contract
  const { data: nftProgram } = useProgram({
    library: NFT_ABI as any,
    id: NFT_CONTRACT_ID,
  });

  // Mint NFT transaction
  const {
    sendTransaction: mintNFT,
    isLoading: isMinting,
    error: mintError
  } = (useSendProgramTransaction({
    program: nftProgram as any,
    serviceName: 'nft' as any,
    functionName: 'mint' as any,
  }) as any);

  // Transfer NFT transaction
  const {
    sendTransaction: transferNFT,
    isLoading: isTransferring,
    error: transferError
  } = (useSendProgramTransaction({
    program: nftProgram as any,
    serviceName: 'nft' as any,
    functionName: 'transfer' as any,
  }) as any);

  /**
   * Mint a Scorecard NFT with campaign data
   */
  const mintScorecardNFT = async (scoreData: {
    githubId: string;
    overallScore: number;
    impact: number;
    quality: number;
    collaboration: number;
    security: number;
    cid: string;
    windowStart: number;
    windowEnd: number;
  }) => {
    if (!account) {
      throw new Error('Wallet not connected');
    }

    try {
      const metadata = {
        name: `GrowStreams Scorecard - ${scoreData.githubId}`,
  description: `Web3 Contribution Score: ${scoreData.overallScore}`,
        image: `ipfs://${scoreData.cid}/image.png`, // TODO: Generate scorecard image
        attributes: [
          { trait_type: 'GitHub ID', value: scoreData.githubId },
          { trait_type: 'Overall Score', value: scoreData.overallScore },
          { trait_type: 'Impact', value: scoreData.impact },
          { trait_type: 'Quality', value: scoreData.quality },
          { trait_type: 'Collaboration', value: scoreData.collaboration },
          { trait_type: 'Security', value: scoreData.security },
          { trait_type: 'CID', value: scoreData.cid },
          { trait_type: 'Window Start', value: scoreData.windowStart },
          { trait_type: 'Window End', value: scoreData.windowEnd },
        ],
        external_url: `${window.location.origin}/campaign/leaderboard`,
      };

      // TODO: Upload metadata to IPFS and get tokenURI
      const tokenURI = `ipfs://${scoreData.cid}/metadata.json`;

      const result = await mintNFT({
        // Cast args and value to any for now until ABI/types are provided
        args: [account.decodedAddress, tokenURI, metadata] as any,
        value: BigInt(0) as any, // No payment required
      } as any);

      return result;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  };

  return {
    mintScorecardNFT,
    transferNFT,
    isMinting,
    isTransferring,
    mintError,
    transferError,
    isConnected: !!account,
  };
}
