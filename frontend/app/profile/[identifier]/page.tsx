"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Navigation } from "@/components/provn/navigation";
import { Button } from "@/components/provn/button";
import { Badge } from "@/components/provn/badge";
// Icons replaced with emojis for compatibility
import { useAuth } from "@campnetwork/origin/react";
import { toast } from "sonner";
import { ProfileEditModal } from "@/components/provn/profile-edit-modal";

interface UserProfile {
  id: number;
  walletAddress: string;
  handle: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  verified: boolean;
  followersCount: number;
  followingCount: number;
  totalEarnings: number;
  joinedDate: string;
  stats: {
    totalContent: number;
    totalLikes: number;
    totalViews: number;
    totalTipsReceived: number;
  };
  recentContent: Array<{
    id: number;
    title: string;
    thumbnailUrl: string;
    mintDate: string;
    fileType: string;
  }>;
}

export default function ProfilePage() {
  const params = useParams();
  const { walletAddress: currentUserAddress } = useAuth();
  const identifier = params?.identifier as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Check if this is the current user's profile
  const isOwnProfile = currentUserAddress && 
    (currentUserAddress.toLowerCase() === identifier?.toLowerCase() ||
     profile?.walletAddress.toLowerCase() === currentUserAddress.toLowerCase());

  useEffect(() => {
    if (!identifier) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Check if identifier is a wallet address or handle
        const isWalletAddress = identifier.startsWith('0x') && identifier.length === 42;
        const queryParam = isWalletAddress ? `wallet=${identifier}` : `handle=${identifier}`;
        
        const response = await fetch(`/api/users?${queryParam}`);
        const data = await response.json();

        if (data.success) {
          setProfile(data.user);
        } else {
          toast.error('Profile not found');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [identifier]);

  const handleCopyAddress = async () => {
    if (!profile) return;
    
    try {
      await navigator.clipboard.writeText(profile.walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      toast.success('Address copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy address');
    }
  };

  const handleSaveProfile = async (updatedProfile: any) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the local profile state
        setProfile(prev => prev ? {
          ...prev,
          handle: updatedProfile.handle || prev.handle,
          displayName: updatedProfile.displayName || prev.displayName,
          bio: updatedProfile.bio || prev.bio,
          avatarUrl: updatedProfile.avatarUrl || prev.avatarUrl,
          bannerUrl: updatedProfile.bannerUrl || prev.bannerUrl,
        } : null);
        
        setIsEditing(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      throw error;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('audio/')) return '🎵';
    return '📄';
  };

  if (loading) {
    return (
      <>
        <Navigation currentPage="profile" />
        <div className="min-h-screen bg-provn-bg flex items-center justify-center">
          <div className="text-provn-text">Loading profile...</div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navigation currentPage="profile" />
        <div className="min-h-screen bg-provn-bg flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-xl text-provn-text">Profile not found</div>
            <div className="text-provn-muted">The requested profile could not be found.</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation currentPage="profile" />
      
      <div className="min-h-screen bg-provn-bg">
        {/* Banner Section */}
        <div className="relative">
          <div 
            className="h-48 sm:h-64 bg-gradient-to-r from-provn-accent to-provn-accent-press"
            style={{
              backgroundImage: profile.bannerUrl ? `url(${profile.bannerUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Profile Content Container */}
          <div className="max-w-4xl mx-auto px-4">
            {/* Profile Header */}
            <div className="relative -mt-16 sm:-mt-20">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={profile.avatarUrl && profile.avatarUrl.trim() !== '' ? profile.avatarUrl : '/placeholder-avatar.png'}
                    alt={profile.handle}
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-provn-bg object-cover bg-provn-surface"
                  />
                  {profile.verified && (
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-provn-bg">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  )}
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 space-y-3 sm:mb-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-provn-text">
                      {profile.displayName || profile.handle}
                    </h1>
                    {profile.displayName && (
                      <p className="text-provn-muted">{profile.handle}</p>
                    )}
                  </div>
                  
                  {/* Wallet Address */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-provn-muted font-mono">
                      {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyAddress}
                      className="w-6 h-6 p-0"
                    >
                      {copiedAddress ? (
                        <span>✓</span>
                      ) : (
                        <span>📋</span>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(`https://basecamp.cloud.blockscout.com/address/${profile.walletAddress}`, '_blank')}
                      className="w-6 h-6 p-0"
                    >
                      🔗
                    </Button>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 self-start sm:self-end">
                  {isOwnProfile ? (
                    <Button 
                      variant="secondary"
                      onClick={() => setIsEditing(true)}
                    >
                      ⚙️ 
                      Edit Profile
                    </Button>
                  ) : (
                    <Button variant="secondary">
                      👥
                      Follow
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Bio */}
              {profile.bio && (
                <div className="mt-4 sm:mt-6">
                  <p className="text-provn-text leading-relaxed">{profile.bio}</p>
                </div>
              )}
              
              {/* Stats Row */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-provn-text">
                    {formatNumber(profile.stats.totalContent)}
                  </div>
                  <div className="text-sm text-provn-muted">Content</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-provn-text">
                    {formatNumber(profile.followersCount)}
                  </div>
                  <div className="text-sm text-provn-muted">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-provn-text">
                    {formatNumber(profile.followingCount)}
                  </div>
                  <div className="text-sm text-provn-muted">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-provn-text">
                    {formatNumber(profile.stats.totalLikes)}
                  </div>
                  <div className="text-sm text-provn-muted">Likes</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-provn-text">
                    {formatNumber(profile.stats.totalViews)}
                  </div>
                  <div className="text-sm text-provn-muted">Views</div>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-provn-muted">
                <div className="flex items-center gap-1">
                  Joined {formatDate(profile.joinedDate)}
                </div>
                {profile.stats.totalTipsReceived > 0 && (
                  <div className="flex items-center gap-1">
                    💰
                    {profile.stats.totalTipsReceived} CAMP earned
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Grid */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-provn-text">Recent Content</h2>
              {profile.stats.totalContent > profile.recentContent.length && (
                <Button variant="secondary" size="sm">
                  View All ({profile.stats.totalContent})
                </Button>
              )}
            </div>
            
            {profile.recentContent.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-provn-muted">No content yet</div>
                {isOwnProfile && (
                  <Button 
                    className="mt-4"
                    onClick={() => window.location.href = '/simple-mint'}
                  >
                    Create Your First Content
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {profile.recentContent.map((content) => (
                  <div
                    key={content.id}
                    className="group relative aspect-square bg-provn-surface rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-provn-accent transition-all"
                    onClick={() => window.location.href = `/video/${content.id}`}
                  >
                    {content.fileType.startsWith('image/') ? (
                      <img
                        src={content.thumbnailUrl || undefined}
                        alt={content.title}
                        className="w-full h-full object-cover"
                      />
                    ) : content.fileType.startsWith('video/') ? (
                      <div className="w-full h-full relative">
                        <video
                          src={content.thumbnailUrl || undefined}
                          className="w-full h-full object-cover"
                          muted
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <div className="text-2xl">▶️</div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-provn-surface-2 flex flex-col items-center justify-center">
                        <span className="text-4xl mb-2">{getFileTypeIcon(content.fileType)}</span>
                        <span className="text-xs text-provn-muted">{content.fileType.split('/')[1].toUpperCase()}</span>
                      </div>
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <div className="text-white text-sm font-medium line-clamp-2">
                        {content.title}
                      </div>
                      <div className="text-white/70 text-xs">
                        {formatDate(content.mintDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      {profile && (
        <ProfileEditModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          profile={{
            walletAddress: profile.walletAddress,
            handle: profile.handle,
            displayName: profile.displayName,
            bio: profile.bio,
            avatarUrl: profile.avatarUrl,
            bannerUrl: profile.bannerUrl,
          }}
          onSave={handleSaveProfile}
        />
      )}
    </>
  );
}