"use client";

import React, { useState, useRef } from "react";
import { ProvnButton } from "./button";
import { ProvnCard, ProvnCardContent } from "./card";
import { toast } from "sonner";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    walletAddress: string;
    handle: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    bannerUrl?: string;
  };
  onSave: (updatedProfile: any) => Promise<void>;
}

export function ProfileEditModal({ isOpen, onClose, profile, onSave }: ProfileEditModalProps) {
  const [formData, setFormData] = useState({
    handle: profile.handle || '',
    displayName: profile.displayName || '',
    bio: profile.bio || '',
    avatarUrl: profile.avatarUrl || '',
    bannerUrl: profile.bannerUrl || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatarUrl || '');
  const [bannerPreview, setBannerPreview] = useState(profile.bannerUrl || '');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const uploadToIPFS = async (file: File): Promise<string> => {
    const pinataJWT = process.env.NEXT_PUBLIC_PINATA_JWT;
    
    console.log('🔑 Pinata JWT available:', !!pinataJWT);
    console.log('📁 File details:', { name: file.name, size: file.size, type: file.type });
    
    if (!pinataJWT) {
      throw new Error('Pinata JWT not configured. Please set NEXT_PUBLIC_PINATA_JWT in your environment variables.');
    }

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    console.log('📤 Making request to Pinata API...');
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      body: formDataUpload,
      headers: {
        'Authorization': `Bearer ${pinataJWT}`,
      },
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload error:', errorText);
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Upload successful:', result);
    return `https://ipfs.io/ipfs/${result.IpfsHash}`;
  };

  const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    try {
      const imageUrl = await uploadToIPFS(file);
      
      if (type === 'avatar') {
        setFormData(prev => ({ ...prev, avatarUrl: imageUrl }));
        setAvatarPreview(imageUrl);
        toast.success('Avatar uploaded successfully');
      } else {
        setFormData(prev => ({ ...prev, bannerUrl: imageUrl }));
        setBannerPreview(imageUrl);
        toast.success('Banner uploaded successfully');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'avatar');
    }
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'banner');
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);

      // Validate handle format
      if (formData.handle && !formData.handle.startsWith('@')) {
        setFormData(prev => ({ ...prev, handle: `@${prev.handle}` }));
      }

      // Validate handle uniqueness would be done server-side
      
      await onSave({
        walletAddress: profile.walletAddress,
        ...formData,
      });

      toast.success('Profile updated successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 bg-provn-surface rounded-2xl border border-provn-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-provn-border">
          <h2 className="text-xl font-bold text-provn-text">Edit Profile</h2>
          <ProvnButton
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0"
          >
            X
          </ProvnButton>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Banner Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-provn-text">Banner Image</label>
              <div className="relative">
                <div
                  className="w-full h-32 rounded-lg bg-gradient-to-r from-provn-accent to-provn-accent-press flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  style={{
                    backgroundImage: bannerPreview ? `url(${bannerPreview})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                  onClick={() => bannerInputRef.current?.click()}
                >
                  {!bannerPreview && (
                    <div className="flex flex-col items-center text-white/80">
                      <span className="text-sm">Upload Banner</span>
                    </div>
                  )}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="hidden"
                  />
                </div>
              </div>
              <p className="text-xs text-provn-muted">Recommended: 1200x400px, max 5MB</p>
            </div>

            {/* Avatar Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-provn-text">Profile Picture</label>
              <div className="flex items-center gap-4">
                <div
                  className="relative w-20 h-20 rounded-full bg-provn-surface-2 border-2 border-provn-border overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-provn-muted">Upload Image</span>
                    </div>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div className="space-y-1">
                  <ProvnButton
                    variant="secondary"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    Upload Image
                  </ProvnButton>
                  <p className="text-xs text-provn-muted">Square image, max 5MB</p>
                </div>
              </div>
            </div>

            {/* Handle */}
            <div className="space-y-2">
              <label htmlFor="handle" className="text-sm font-medium text-provn-text">
                Handle
              </label>
              <input
                id="handle"
                type="text"
                value={formData.handle}
                onChange={(e) => handleInputChange('handle', e.target.value)}
                placeholder="@yourhandle"
                className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                maxLength={50}
              />
              <p className="text-xs text-provn-muted">This will be your unique identifier on the platform</p>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium text-provn-text">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                placeholder="Your display name"
                className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                maxLength={100}
              />
              <p className="text-xs text-provn-muted">This is how your name will appear to others</p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label htmlFor="bio" className="text-sm font-medium text-provn-text">
                Bio
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent resize-none"
                maxLength={300}
              />
              <div className="text-xs text-provn-muted text-right">
                {formData.bio.length}/300 characters
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-provn-border bg-provn-surface-2">
          <ProvnButton variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </ProvnButton>
          <ProvnButton onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </ProvnButton>
        </div>
      </div>
    </div>
  );
}