"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ProvnButton } from "@/components/provn/button"
import { ProvnCard, ProvnCardContent, ProvnCardHeader } from "@/components/provn/card"
import { Navigation } from "@/components/provn/navigation"

interface EvidenceFile {
  file: File
  preview?: string
  type: "image" | "video" | "document"
}

interface DisputeFormData {
  targetTokenId: string
  reason: "duplicate" | "infringement" | "inappropriate" | "other"
  description: string
  evidenceFiles: EvidenceFile[]
  contactEmail: string
}

export default function NewDisputePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetTokenId = searchParams.get("target") || ""

  const [formData, setFormData] = useState<DisputeFormData>({
    targetTokenId,
    reason: "duplicate",
    description: "",
    evidenceFiles: [],
    contactEmail: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const reasonOptions = [
    {
      value: "duplicate" as const,
      label: "Duplicate Content",
      description: "This content is identical or substantially similar to existing content",
    },
    {
      value: "infringement" as const,
      label: "Copyright Infringement",
      description: "This content violates my intellectual property rights",
    },
    {
      value: "inappropriate" as const,
      label: "Inappropriate Content",
      description: "This content violates community guidelines",
    },
    {
      value: "other" as const,
      label: "Other",
      description: "Other legal or policy concerns",
    },
  ]

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/quicktime",
      "application/pdf",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      return "Please upload images, videos, PDFs, or text files only"
    }

    if (file.size > maxSize) {
      return "File size must be under 10MB"
    }

    return null
  }

  const getFileType = (file: File): "image" | "video" | "document" => {
    if (file.type.startsWith("image/")) return "image"
    if (file.type.startsWith("video/")) return "video"
    return "document"
  }

  const handleFileSelect = (files: FileList) => {
    const newFiles: EvidenceFile[] = []

    Array.from(files).forEach((file) => {
      const error = validateFile(file)
      if (error) {
        alert(error)
        return
      }

      const fileType = getFileType(file)
      const evidenceFile: EvidenceFile = {
        file,
        type: fileType,
      }

      if (fileType === "image" || fileType === "video") {
        evidenceFile.preview = URL.createObjectURL(file)
      }

      newFiles.push(evidenceFile)
    })

    setFormData((prev) => ({
      ...prev,
      evidenceFiles: [...prev.evidenceFiles, ...newFiles],
    }))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    setFormData((prev) => {
      const file = prev.evidenceFiles[index]
      if (file.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return {
        ...prev,
        evidenceFiles: prev.evidenceFiles.filter((_, i) => i !== index),
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.targetTokenId || !formData.description.trim()) {
      alert("Please provide a target token ID and description")
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call to submit dispute
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // In real app, would upload evidence files and submit dispute data
      console.log("Dispute submitted:", formData)

      setSubmitSuccess(true)
    } catch (error) {
      console.error("Failed to submit dispute:", error)
      alert("Failed to submit dispute. Please try again.")
    }

    setIsSubmitting(false)
  }

  if (submitSuccess) {
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
              <h1 className="font-headline text-4xl font-bold text-provn-text">Dispute Submitted</h1>
              <p className="text-provn-muted text-lg">Your dispute has been submitted for review</p>
            </div>

            {/* Next Steps */}
            <ProvnCard>
              <ProvnCardContent className="p-6 text-left">
                <h3 className="font-headline text-lg font-semibold text-provn-text mb-4">What happens next?</h3>
                <div className="space-y-3 text-sm text-provn-muted">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-provn-accent rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="text-provn-text font-medium">Review Process</div>
                      <div>Our moderation team will review your dispute within 24-48 hours</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-provn-accent rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <div className="text-provn-text font-medium">Investigation</div>
                      <div>We'll examine the evidence and contact relevant parties if needed</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-provn-accent rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                      3
                    </div>
                    <div>
                      <div className="text-provn-text font-medium">Resolution</div>
                      <div>We'll take appropriate action and notify you of the outcome</div>
                    </div>
                  </div>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <ProvnButton variant="secondary" onClick={() => router.push("/")}>
                Go Home
              </ProvnButton>
              <ProvnButton onClick={() => router.push("/disputes/new")}>Submit Another</ProvnButton>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-provn-bg">
      <Navigation />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="font-headline text-4xl font-bold text-provn-text">File a Dispute</h1>
            <p className="text-provn-muted text-lg">
              Report content that violates our community guidelines or your rights
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Target Content */}
            <ProvnCard>
              <ProvnCardHeader>
                <h2 className="font-headline text-xl font-semibold text-provn-text">Target Content</h2>
              </ProvnCardHeader>
              <ProvnCardContent className="p-6">
                <div>
                  <label htmlFor="targetTokenId" className="block text-provn-text font-medium mb-2">
                    Token ID or Video URL
                  </label>
                  <input
                    type="text"
                    id="targetTokenId"
                    value={formData.targetTokenId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, targetTokenId: e.target.value }))}
                    className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                    placeholder="e.g., #123 or https://provn.app/video/123"
                    required
                  />
                  <p className="text-provn-muted text-sm mt-1">
                    Enter the token ID or URL of the content you're disputing
                  </p>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Dispute Reason */}
            <ProvnCard>
              <ProvnCardHeader>
                <h2 className="font-headline text-xl font-semibold text-provn-text">Reason for Dispute</h2>
              </ProvnCardHeader>
              <ProvnCardContent className="p-6">
                <div className="space-y-4">
                  {reasonOptions.map((option) => (
                    <label key={option.value} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={option.value}
                        checked={formData.reason === option.value}
                        onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value as any }))}
                        className="mt-1 w-4 h-4 text-provn-accent bg-provn-surface-2 border-provn-border focus:ring-provn-accent focus:ring-2"
                      />
                      <div>
                        <div className="text-provn-text font-medium">{option.label}</div>
                        <div className="text-provn-muted text-sm">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Description */}
            <ProvnCard>
              <ProvnCardHeader>
                <h2 className="font-headline text-xl font-semibold text-provn-text">Detailed Description</h2>
              </ProvnCardHeader>
              <ProvnCardContent className="p-6">
                <div>
                  <label htmlFor="description" className="block text-provn-text font-medium mb-2">
                    Explain your dispute
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={6}
                    className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent resize-none"
                    placeholder="Provide detailed information about your dispute, including dates, evidence, and any relevant context..."
                    required
                  />
                  <p className="text-provn-muted text-sm mt-1">
                    Be as specific as possible to help our team understand your concern
                  </p>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Evidence Upload */}
            <ProvnCard>
              <ProvnCardHeader>
                <h2 className="font-headline text-xl font-semibold text-provn-text">Supporting Evidence</h2>
              </ProvnCardHeader>
              <ProvnCardContent className="p-6">
                <div className="space-y-4">
                  {/* Upload Zone */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-provn-accent bg-provn-accent-subtle"
                        : "border-provn-border hover:border-provn-accent/50"
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-provn-surface-2 rounded-xl flex items-center justify-center mx-auto">
                        <span className="text-xl">📎</span>
                      </div>
                      <div>
                        <p className="text-provn-text font-medium mb-2">Upload supporting evidence</p>
                        <input
                          type="file"
                          accept="image/*,video/*,.pdf,.txt"
                          onChange={handleFileInput}
                          multiple
                          className="hidden"
                          id="evidence-input"
                        />
                        <label
                          htmlFor="evidence-input"
                          className="text-provn-accent hover:text-provn-accent-press cursor-pointer underline"
                        >
                          Browse files
                        </label>
                      </div>
                      <p className="text-provn-muted text-sm">Images, videos, PDFs, or text files • Max 10MB each</p>
                    </div>
                  </div>

                  {/* Uploaded Files */}
                  {formData.evidenceFiles.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-provn-text">
                        Uploaded Evidence ({formData.evidenceFiles.length})
                      </h4>
                      <div className="grid gap-3">
                        {formData.evidenceFiles.map((evidence, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-provn-surface-2 rounded-lg">
                            {evidence.preview && evidence.type === "image" && (
                              <img
                                src={evidence.preview || "/placeholder.svg"}
                                alt="Evidence"
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            {evidence.type === "document" && (
                              <div className="w-12 h-12 bg-provn-accent/20 rounded flex items-center justify-center">
                                <span className="text-provn-accent text-xs font-bold">DOC</span>
                              </div>
                            )}
                            {evidence.type === "video" && (
                              <div className="w-12 h-12 bg-provn-accent/20 rounded flex items-center justify-center">
                                <span className="text-provn-accent text-xs font-bold">VID</span>
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="text-provn-text font-medium">{evidence.file.name}</div>
                              <div className="text-provn-muted text-sm">
                                {(evidence.file.size / (1024 * 1024)).toFixed(1)} MB
                              </div>
                            </div>
                            <ProvnButton type="button" variant="secondary" size="sm" onClick={() => removeFile(index)}>
                              Remove
                            </ProvnButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Contact Information */}
            <ProvnCard>
              <ProvnCardHeader>
                <h2 className="font-headline text-xl font-semibold text-provn-text">Contact Information</h2>
              </ProvnCardHeader>
              <ProvnCardContent className="p-6">
                <div>
                  <label htmlFor="contactEmail" className="block text-provn-text font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    className="w-full px-4 py-3 bg-provn-surface-2 border border-provn-border rounded-lg text-provn-text placeholder-provn-muted focus:outline-none focus:ring-2 focus:ring-provn-accent focus:border-transparent"
                    placeholder="your.email@example.com"
                    required
                  />
                  <p className="text-provn-muted text-sm mt-1">We'll use this to contact you about your dispute</p>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Legal Notice */}
            <ProvnCard>
              <ProvnCardContent className="p-6">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h3 className="font-headline text-sm font-semibold text-yellow-400 mb-2">Legal Notice</h3>
                  <p className="text-yellow-300 text-sm leading-relaxed">
                    By submitting this dispute, you confirm that the information provided is accurate and complete.
                    False or malicious reports may result in account restrictions. For copyright claims, you may need to
                    provide additional legal documentation.
                  </p>
                </div>
              </ProvnCardContent>
            </ProvnCard>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-center">
              <ProvnButton type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </ProvnButton>
              <ProvnButton
                type="submit"
                disabled={isSubmitting || !formData.targetTokenId || !formData.description.trim()}
                className="min-w-[160px]"
              >
                {isSubmitting ? "Submitting..." : "Submit Dispute"}
              </ProvnButton>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
