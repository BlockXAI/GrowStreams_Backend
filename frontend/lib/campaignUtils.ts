/**
 * Campaign Utility Functions
 * Helpers for the Web3 Contribution Challenge
 */

export interface ScoreData {
  overall: number;
  impact: number;
  quality: number;
  collaboration: number;
  security: number;
  cid: string;
}

export interface CampaignParticipant {
  actorId: string;
  githubId: string;
  scoreData: ScoreData;
  nftMinted: boolean;
  tweetUrl?: string;
  timestamp: number;
}

/**
 * Generate tweet text for sharing campaign results
 */
export function generateCampaignTweet(scoreData: ScoreData, githubId: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://growstreams.app';
  
  return `I just verified my Web3 contributions on @VaraNetwork!\n` +
    `Score: ${scoreData.overall} | CID: ${scoreData.cid.substring(0, 10)}...\n` +
    `Minted my Scorecard NFT 🎖️\n` +
    `Join the leaderboard → ${baseUrl}/campaign/leaderboard\n` +
    `#GrowStreamsChallenge #Vara #Web3Builders`;
}

/**
 * Calculate campaign window dates
 */
export function getCampaignWindow(days: number = 30): {
  windowStart: number;
  windowEnd: number;
} {
  const windowEnd = Date.now();
  const windowStart = windowEnd - (days * 24 * 60 * 60 * 1000);
  
  return { windowStart, windowEnd };
}

/**
 * Format actor ID for display
 */
export function formatActorId(actorId: string): string {
  if (actorId.length <= 10) return actorId;
  return `${actorId.substring(0, 6)}...${actorId.substring(actorId.length - 4)}`;
}

/**
 * Validate GitHub username format
 */
export function isValidGitHubUsername(username: string): boolean {
  // GitHub usernames:
  // - can only contain alphanumeric characters and hyphens
  // - cannot have multiple consecutive hyphens
  // - cannot begin or end with a hyphen
  // - maximum 39 characters
  const githubUsernameRegex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  return githubUsernameRegex.test(username);
}

/**
 * Calculate days remaining in campaign
 */
export function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 75) return 'text-blue-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Sort leaderboard by category
 */
export function sortLeaderboard(
  entries: CampaignParticipant[],
  category: 'overall' | 'impact' | 'quality' | 'collaboration' | 'security'
): CampaignParticipant[] {
  return [...entries].sort((a, b) => {
    if (category === 'overall') {
      return b.scoreData.overall - a.scoreData.overall;
    }
    return b.scoreData[category] - a.scoreData[category];
  });
}

/**
 * Check if user is eligible for prizes
 */
export function isEligibleForPrizes(participant: CampaignParticipant): boolean {
  return participant.nftMinted && !!participant.tweetUrl && participant.scoreData.overall >= 40;
}

/**
 * Generate scorecard image URL (placeholder for now)
 */
export function generateScorecardImageUrl(scoreData: ScoreData, githubId: string): string {
  // TODO: Implement actual image generation service
  // This could be an API route that generates an SVG or uses a service like Canvas
  return `/api/scorecard-image?github=${githubId}&score=${scoreData.overall}`;
}
