export interface ExploreVideo {
  tokenId: string;
  title: string;
  description: string;
  tags: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  creator: {
    handle: string;
    displayName: string;
    avatarUrl?: string;
    walletAddress: string;
    followers: number;
    joinedDate: string;
  };
  ipInfo: {
    ipnftId: string;
    status: string;
    type: string;
    mintDate?: string;
    platformOrigin?: boolean;
  };
  licensing: {
    price: number;
    duration: number;
    royalty: number;
    paymentToken: string;
  };
  metrics: {
    views: number;
    likes: number;
    tips: number;
    shares: number;
  };
  isLiked: boolean;
  hasAccess: boolean;
}
