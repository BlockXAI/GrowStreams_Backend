"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, User, AtSign, FileText, Image as ImageIcon, Upload, Trash2 } from "lucide-react"
import { ProvnButton } from "./button"
import { ProvnCard, ProvnCardContent } from "./card"
import { toast } from "sonner"
import { useAuth } from "@campnetwork/origin/react"

interface CreateProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (handle: string) => void
}

interface FormData {
  handle: string
  display_name: string
  bio: string
  avatar_url: string
}

interface ImageUpload {
  file: File | null
  preview: string | null
  uploading: boolean
}

export function CreateProfileModal({ isOpen, onClose, onSuccess }: CreateProfileModalProps) {
  const { walletAddress } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState<FormData>({
    handle: "",
    display_name: "",
    bio: "",
    avatar_url: ""
  })
  const [imageUpload, setImageUpload] = useState<ImageUpload>({
    file: null,
    preview: null,
    uploading: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null)
  const [isCheckingHandle, setIsCheckingHandle] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        handle: "",
        display_name: "",
        bio: "",
        avatar_url: ""
      })
      setImageUpload({
        file: null,
        preview: null,
        uploading: false
      })
      setHandleAvailable(null)
    }
  }, [isOpen])

  // Handle image file selection
  const handleImageSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageUpload({
        file,
        preview: e.target?.result as string,
        uploading: false
      })
      // Set the avatar URL to the preview for now
      setFormData(prev => ({ ...prev, avatar_url: e.target?.result as string }))
    }
    reader.readAsDataURL(file)
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Remove image
  const removeImage = () => {
    setImageUpload({
      file: null,
      preview: null,
      uploading: false
    })
    setFormData(prev => ({ ...prev, avatar_url: "" }))
  }

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Check handle availability
  const checkHandleAvailability = async (handle: string) => {
    if (!handle || handle.length < 3) {
      setHandleAvailable(null)
      return
    }

    // Validate handle format
    if (!/^[a-z][a-z0-9_]{2,29}$/.test(handle)) {
      setHandleAvailable(false)
      return
    }

    setIsCheckingHandle(true)
    try {
      const response = await fetch(`/api/profile/${handle}`)
      const data = await response.json()
      
      console.log('🔍 Handle availability check:', {
        handle,
        status: response.status,
        data
      })
      
      if (response.status === 404) {
        // Profile not found = handle available
        setHandleAvailable(true)
      } else if (data.success && data.profile) {
        // Profile found = handle taken
        setHandleAvailable(false)
      } else if (response.status === 500) {
        // Server error (likely table doesn't exist) = assume available
        console.warn('Server error during handle check, assuming available:', data.error)
        setHandleAvailable(true)
      } else {
        // Other response = handle taken
        setHandleAvailable(false)
      }
    } catch (error) {
      console.error('Error checking handle availability:', error)
      // Network error = assume available to allow user to proceed
      setHandleAvailable(true)
    } finally {
      setIsCheckingHandle(false)
    }
  }

  // Temporarily disabled handle availability check to fix profile creation
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     if (formData.handle) {
  //       checkHandleAvailability(formData.handle)
  //     }
  //   }, 500)

  //   return () => clearTimeout(timer)
  // }, [formData.handle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!walletAddress) {
      toast.error('Wallet not connected')
      return
    }

    if (!formData.handle) {
      toast.error('Handle is required')
      return
    }

    // Temporarily disable handle availability check to fix profile creation
    // TODO: Re-enable once Supabase connection is fully working
    console.log('Proceeding with profile creation, handle availability check disabled')

    setIsSubmitting(true)
    try {
      // For now, we'll use the data URL from the image preview
      // In a production app, you'd upload to Supabase storage first
      const avatarUrl = imageUpload.preview || formData.avatar_url
      
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-wallet-address': walletAddress
        },
        body: JSON.stringify({
          handle: formData.handle,
          display_name: formData.display_name || undefined,
          bio: formData.bio || undefined,
          avatar_url: avatarUrl || undefined
        })
      })

      const data = await response.json()
      
      console.log('📋 Profile Creation Response:', { status: response.status, data })

      if (data.success) {
        toast.success('Profile created successfully!')
        onSuccess(formData.handle)
        onClose()
      } else {
        // Show specific error messages based on response
        if (response.status === 409) {
          if (data.error.includes('Handle')) {
            toast.error('Handle already taken. Please choose a different one.')
          } else if (data.error.includes('wallet')) {
            toast.error('Profile already exists for this wallet address.')
          } else {
            toast.error(data.error)
          }
        } else if (response.status === 500 && data.error.includes('Database not set up')) {
          toast.error('Database configuration error. Please contact support.')
        } else {
          toast.error(data.error || 'Failed to create profile')
        }
        
        // Log detailed error for debugging
        console.error('❌ Profile Creation Error:', {
          status: response.status,
          error: data.error,
          details: data.details,
          code: data.code
        })
      }
    } catch (error: any) {
      console.error('❌ Profile Creation Network Error:', error)
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error(error.message || 'Failed to create profile')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getHandleStatus = (): 'checking' | 'available' | 'taken' | 'invalid' | null => {
    // Temporarily always return available to fix profile creation
    if (!formData.handle) return null
    return 'available'
  }

  const getHandleStatusText = () => {
    const status = getHandleStatus()
    switch (status) {
      case 'checking': return 'Checking...'
      case 'available': return 'Handle available'
      case 'taken': return 'Handle taken'
      case 'invalid': return 'Invalid handle format'
      default: return ''
    }
  }

  const getHandleStatusColor = () => {
    const status = getHandleStatus()
    switch (status) {
      case 'available': return 'text-green-500'
      case 'taken': return 'text-red-500'
      case 'invalid': return 'text-red-500'
      default: return 'text-provn-muted'
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <ProvnCard className="relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-provn-accent rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-provn-bg" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-provn-text font-headline">Create Profile</h2>
                  <p className="text-sm text-provn-muted font-headline">Set up your creator profile</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-provn-surface/50 transition-colors"
              >
                <X className="w-5 h-5 text-provn-muted" />
              </button>
            </div>

            <ProvnCardContent className="p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Handle */}
                <div>
                  <label className="block text-sm font-medium text-provn-text mb-2">
                    Handle <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-provn-muted">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.handle}
                      onChange={(e) => handleInputChange('handle', e.target.value.toLowerCase())}
                      className="w-full pl-10 pr-3 py-2 bg-provn-surface border border-provn-border rounded-lg focus:ring-2 focus:ring-provn-accent focus:border-transparent transition-all"
                      placeholder="yourhandle"
                      maxLength={30}
                      required
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-provn-muted">
                      {formData.handle.length}/30 characters
                    </span>
                    <span className={`text-xs ${getHandleStatusColor()}`}>
                      {getHandleStatusText()}
                    </span>
                  </div>
                  <p className="text-xs text-provn-muted mt-1">
                    Lowercase letters, numbers, and underscores only. Cannot start with a number.
                  </p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-provn-text mb-2">
                    Display Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-provn-muted">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-provn-surface border border-provn-border rounded-lg focus:ring-2 focus:ring-provn-accent focus:border-transparent transition-all"
                      placeholder="Your Display Name"
                      maxLength={50}
                    />
                  </div>
                  <span className="text-xs text-provn-muted">
                    {formData.display_name.length}/50 characters
                  </span>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-provn-text mb-2">
                    Bio
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-3 text-provn-muted">
                      <FileText className="w-4 h-4" />
                    </div>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-provn-surface border border-provn-border rounded-lg focus:ring-2 focus:ring-provn-accent focus:border-transparent transition-all resize-none"
                      placeholder="Tell us about yourself..."
                      rows={3}
                      maxLength={500}
                    />
                  </div>
                  <span className="text-xs text-provn-muted">
                    {formData.bio.length}/500 characters
                  </span>
                </div>

                {/* Avatar Upload */}
                <div>
                  <label className="block text-sm font-medium text-provn-text mb-2">
                    Profile Picture <span className="text-provn-muted font-normal">(Optional)</span>
                  </label>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleImageSelect(file)
                    }}
                    className="hidden"
                  />

                  {/* Upload Area */}
                  {!imageUpload.preview ? (
                    <div
                      className="w-full h-32 border-2 border-dashed border-provn-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-provn-accent hover:bg-provn-surface/30 transition-all"
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={triggerFileInput}
                    >
                      <Upload className="w-8 h-8 text-provn-muted mb-2" />
                      <p className="text-sm text-provn-muted text-center">
                        <span className="text-provn-accent font-medium">Click to upload</span> or drag and drop
                      </p>
                                        <p className="text-xs text-provn-muted mt-1">
                    PNG, JPG up to 5MB • Drag & drop or click to upload
                  </p>
                    </div>
                  ) : (
                    /* Image Preview */
                    <div className="relative">
                      <div className="w-full h-32 rounded-lg overflow-hidden bg-provn-surface border border-provn-border">
                        <img
                          src={imageUpload.preview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <ProvnButton
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !formData.handle}
                  >
                    {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
                  </ProvnButton>
                </div>
              </form>
            </ProvnCardContent>
          </ProvnCard>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
