"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent } from "@/components/provn/card"
import { ProvnBadge } from "@/components/provn/badge"
import { Navigation } from "@/components/provn/navigation"

interface UploadedFile {
  file: File
  preview: string
}

interface ProcessingStep {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  message?: string
}

interface MintResult {
  tokenId: string
  parentTokenId: string
  ipfsHash: string
  transactionHash: string
  blockscoutUrl: string
}

interface ParentVideo {
  id: string
  title: string
  creator: string
}

export default function DerivativeUploadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const parentId = searchParams.get("parent")

  const [parentVideo, setParentVideo] = useState<ParentVideo | null>(null)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [title, setTitle] = useState("")
  const [tags, setTags] = useState("")
  const [derivativeDescription, setDerivativeDescription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [mintResult, setMintResult] = useState<MintResult | null>(null)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    { id: "validation", name: "File Validation", status: "pending", progress: 0 },
    { id: "transcoding", name: "Transcoding to HLS", status: "pending", progress: 0 },
    { id: "ipfs", name: "Uploading to IPFS", status: "pending", progress: 0 },
    { id: "lineage", name: "Setting Parent Lineage", status: "pending", progress: 0 },
    { id: "minting", name: "Minting Derivative IpNFT", status: "pending", progress: 0 },
  ])

  useEffect(() => {
    if (parentId) {
      // Mock parent video data - in real app would fetch from API
      setParentVideo({
        id: parentId,
        title: "Creative Dance Routine",
        creator: "0x1234567890abcdef1234567890abcdef12345678",
      })
    }
  }, [parentId])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const validateFile = (file: File): string | null => {
    const maxSize = 150 * 1024 * 1024 // 150MB
    const allowedTypes = ["video/mp4", "video/quicktime"]

    if (!allowedTypes.includes(file.type)) {
      return "Please upload MP4 or MOV files only"
    }

    if (file.size > maxSize) {
      return "File size must be under 150MB"
    }

    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      alert(error)
      return
    }

    const preview = URL.createObjectURL(file)
    setUploadedFile({ file, preview })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const updateProcessingStep = (stepId: string, updates: Partial<ProcessingStep>) => {
    setProcessingSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, ...updates } : step)))
  }

  const simulateProcessingStep = async (stepId: string, duration = 2000) => {
    updateProcessingStep(stepId, { status: "processing", progress: 0 })

    const progressInterval = setInterval(() => {
      setProcessingSteps((prev) =>
        prev.map((step) => {
          if (step.id === stepId && step.status === "processing") {
            const newProgress = Math.min(step.progress + Math.random() * 20, 95)
            return { ...step, progress: newProgress }
          }
          return step
        }),
      )
    }, 200)

    await new Promise((resolve) => setTimeout(resolve, duration))
    clearInterval(progressInterval)
    updateProcessingStep(stepId, { status: "completed", progress: 100 })
  }

  const handleUpload = async () => {
    if (!uploadedFile || !title.trim() || !parentId) {
      alert("Please provide a file, title, and ensure parent video is selected")
      return
    }

    setIsProcessing(true)

    try {
      // Step 1: File Validation
      await simulateProcessingStep("validation", 500)

      // Step 2: Transcoding
      updateProcessingStep("transcoding", {
        status: "processing",
        message: "Converting derivative content to HLS format...",
      })
      await simulateProcessingStep("transcoding", 3000)

      // Step 3: IPFS Upload
      updateProcessingStep("ipfs", {
        status: "processing",
        message: "Uploading derivative to decentralized storage...",
      })
      await simulateProcessingStep("ipfs", 2500)

      // Step 4: Setting Parent Lineage
      updateProcessingStep("lineage", {
        status: "processing",
        message: "Establishing parent-child relationship on-chain...",
      })
      await simulateProcessingStep("lineage", 1500)

      // Step 5: Minting Derivative
      updateProcessingStep("minting", {
        status: "processing",
        message: "Minting derivative IpNFT with 70/30 split...",
      })
      await simulateProcessingStep("minting", 2000)

      // Success - generate mock result
      const mockResult: MintResult = {
        tokenId: `${Date.now()}`,
        parentTokenId: parentId,
        ipfsHash: `Qm${Math.random().toString(36).substring(2, 15)}`,
        transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
        blockscoutUrl: `https://explorer.basecamp.network/tx/0x${Math.random().toString(16).substring(2, 66)}`,
      }

      setMintResult(mockResult)
    } catch (error) {
      console.error("Upload failed:", error)
    }

    setIsProcessing(false)
  }

  const handleCancel = () => {
    if (uploadedFile) {
      URL.revokeObjectURL(uploadedFile.preview)
    }
    router.push(`/video/${parentId}`)
  }

  const handleViewAsset = () => {
    if (mintResult) {
      router.push(`/video/${mintResult.tokenId}`)
    }
  }

  if (!parentVideo) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="font-headline text-2xl font-bold text-provn-text mb-4">Invalid Parent Video</h1>
            <p className="text-provn-muted mb-6">Please select a valid parent video to create a derivative.</p>
            <ProvnButton onClick={() => router.push("/")}>Go Home</ProvnButton>
          </div>
        </main>
      </div>
    )
  }

  if (mintResult) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center space-y-8">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Message */}
            <div className="space-y-4">
              <h1 className="font-headline text-4xl font-bold text-provn-text">Derivative Created!</h1>
              <p className="text-provn-muted text-lg">Your derivative has been registered with verified lineage</p>
            </div>

            {/* Lineage Visualization */}
            <div className="bg-provn-surface border border-provn-border rounded-xl p-6">
              <h3 className="font-headline text-lg font-semibold text-provn-text mb-4">Content Lineage</h3>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-provn-surface-2 rounded-xl flex items-center justify-center mb-2">
                    <span className="text-2xl">🎬</span>
                  </div>
                  <div className="text-provn-text text-sm font-medium">Original</div>
                  <div className="text-provn-muted text-xs">#{mintResult.parentTokenId}</div>
                </div>

                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-provn-accent"></div>
                  <div className="w-3 h-3 bg-provn-accent rounded-full ml-1"></div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-provn-accent/20 rounded-xl flex items-center justify-center mb-2">
                    <span className="text-2xl">🎭</span>
                  </div>
                  <div className="text-provn-text text-sm font-medium">Your Derivative</div>
                  <div className="text-provn-muted text-xs">#{mintResult.tokenId}</div>
                </div>
              </div>
            </div>

            {/* Revenue Split Info */}
            <ProvnCard>
              <ProvnCardContent className="p-6">
                <h3 className="font-headline text-lg font-semibold text-provn-text mb-4">Revenue Split</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-provn-muted">Your earnings from tips:</span>
                    <span className="text-provn-text font-semibold">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-provn-muted">Your earnings from licenses:</span>
                    <span className="text-provn-text font-semibold">70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-provn-muted">Original creator's share:</span>
                    <span className="text-provn-text font-semibold">30%</span>
                  </div>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Transaction Details */}
            <ProvnCard>
              <ProvnCardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-provn-muted">Token ID:</span>
                    <span className="text-provn-text font-mono">{mintResult.tokenId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-provn-muted">Parent Token:</span>
                    <span className="text-provn-text font-mono">{mintResult.parentTokenId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-provn-muted">IPFS Hash:</span>
                    <span className="text-provn-text font-mono text-xs">{mintResult.ipfsHash}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-provn-muted">Transaction:</span>
                    <a
                      href={mintResult.blockscoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-provn-accent hover:underline font-mono text-xs"
                    >
                      View on Blockscout ↗
                    </a>
                  </div>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <ProvnButton variant="secondary" onClick={() => router.push(`/video/${parentId}`)}>
                View Original
              </ProvnButton>
              <ProvnButton onClick={handleViewAsset}>View Your Derivative</ProvnButton>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-provn-bg">
        <Navigation />

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="font-headline text-4xl font-bold text-provn-text">Processing Derivative</h1>
              <p className="text-provn-muted text-lg">Creating your derivative with verified lineage</p>
            </div>

            <ProvnCard>
              <ProvnCardContent className="p-8">
                <div className="space-y-6">
                  {processingSteps.map((step) => (
                    <div key={step.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {step.status === "completed" ? (
                            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : step.status === "processing" ? (
                            <div className="w-6 h-6 border-2 border-provn-accent border-t-transparent rounded-full animate-spin"></div>
                          ) : step.status === "error" ? (
                            <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-provn-border rounded-full"></div>
                          )}
                          <span
                            className={`font-medium ${
                              step.status === "completed"
                                ? "text-green-400"
                                : step.status === "processing"
                                  ? "text-provn-accent"
                                  : step.status === "error"
                                    ? "text-red-400"
                                    : "text-provn-muted"
                            }`}
                          >
                            {step.name}
                          </span>
                        </div>
                        {step.status === "processing" && (
                          <span className="text-provn-accent text-sm font-medium">{Math.round(step.progress)}%</span>
                        )}
                      </div>

                      {step.status === "processing" && (
                        <div className="ml-9">
                          <div className="w-full bg-provn-surface-2 rounded-full h-2">
                            <div
                              className="bg-provn-accent h-2 rounded-full transition-all duration-300"
                              style={{ width: `${step.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {step.message && <p className="ml-9 text-sm text-provn-muted">{step.message}</p>}
                    </div>
                  ))}
                </div>
              </ProvnCardContent>
            </ProvnCard>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="font-headline text-4xl font-bold text-provn-text">Create Derivative</h1>
            <p className="text-provn-muted text-lg">Build upon existing content with verified lineage</p>
          </div>

          {/* Parent Video Info */}
          <ProvnCard>
            <ProvnCardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-provn-surface-2 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎬</span>
                </div>
                <div>
                  <h3 className="font-headline text-lg font-semibold text-provn-text">Original Content</h3>
                  <p className="text-provn-muted">{parentVideo.title}</p>
                  <p className="text-provn-muted text-sm">
                    by {parentVideo.creator.slice(0, 6)}...{parentVideo.creator.slice(-4)}
                  </p>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Upload Zone */}
          <ProvnCard>
            <ProvnCardContent className="p-8">
              {!uploadedFile ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                    isDragOver
                      ? "border-provn-accent bg-provn-accent-subtle"
                      : "border-provn-border hover:border-provn-accent/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-provn-surface-2 rounded-xl flex items-center justify-center mx-auto">
                      <span className="text-2xl">🎭</span>
                    </div>
                    <div>
                      <p className="text-provn-text font-medium mb-2">Upload your derivative content</p>
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime"
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-input"
                      />
                      <label
                        htmlFor="file-input"
                        className="text-provn-accent hover:text-provn-accent-press cursor-pointer underline"
                      >
                        Browse files
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-video bg-black rounded-xl overflow-hidden">
                    <video src={uploadedFile.preview || undefined} controls className="w-full h-full object-contain" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-provn-text font-medium">{uploadedFile.file.name}</p>
                      <p className="text-provn-muted text-sm">
                        {(uploadedFile.file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                    <ProvnButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        URL.revokeObjectURL(uploadedFile.preview)
                        setUploadedFile(null)
                      }}
                    >
                      Remove
                    </ProvnButton>
                  </div>
                </div>
              )}

              <div className="mt-6 text-center">
                <p className="text-provn-muted text-sm">MP4/MOV • up to 150MB • H.264</p>
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Metadata Form */}
          <ProvnCard>
            <ProvnCardContent className="p-8 space-y-6">
              <div>
                <label htmlFor="title" className="block text-provn-text font-medium mb-2">
                  Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                  placeholder="Enter derivative title..."
                />
              </div>

              <div>
                <label htmlFor="derivative-description" className="block text-provn-text font-medium mb-2">
                  How is this different from the original?
                </label>
                <textarea
                  id="derivative-description"
                  value={derivativeDescription}
                  onChange={(e) => setDerivativeDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent resize-none"
                  placeholder="Describe your creative additions, modifications, or interpretations..."
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-provn-text font-medium mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                  placeholder="remix, derivative, creative..."
                />
              </div>

              {/* Revenue Split Info */}
              <div className="bg-provn-surface-2 rounded-lg p-4">
                <h4 className="font-headline text-sm font-semibold text-provn-text mb-2">Revenue Split</h4>
                <div className="space-y-1 text-sm text-provn-muted">
                  <div className="flex justify-between">
                    <span>Your earnings from tips:</span>
                    <span className="text-provn-text font-medium">100%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your earnings from licenses:</span>
                    <span className="text-provn-text font-medium">70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Original creator's share:</span>
                    <span className="text-provn-text font-medium">30%</span>
                  </div>
                </div>
              </div>
            </ProvnCardContent>
          </ProvnCard>

          {/* Gasless Info */}
          <div className="text-center">
            <ProvnBadge variant="success" className="mb-4">
              Gasless
            </ProvnBadge>
            <p className="text-provn-muted text-sm">We sponsor gas on BaseCAMP for derivative minting</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <ProvnButton variant="secondary" onClick={handleCancel}>
              Cancel
            </ProvnButton>
            <ProvnButton onClick={handleUpload} disabled={!uploadedFile || !title.trim()} className="min-w-[160px]">
              Create Derivative
            </ProvnButton>
          </div>
        </div>
      </main>
    </div>
  )
}
