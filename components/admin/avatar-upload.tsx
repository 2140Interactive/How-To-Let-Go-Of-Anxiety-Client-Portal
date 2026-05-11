"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, User } from "lucide-react"

interface AvatarUploadProps {
  teamMemberId: string
  currentPhotoUrl: string | null
  name: string
}

export function AvatarUpload({ teamMemberId, currentPhotoUrl, name }: AvatarUploadProps) {
  const [photoUrl, setPhotoUrl] = useState(currentPhotoUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type client-side
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.")
      return
    }

    // Validate file size client-side (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.")
      return
    }

    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("teamMemberId", teamMemberId)

      const res = await fetch("/api/admin/avatar/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Upload failed.")
        return
      }

      setPhotoUrl(data.photo_url)
      router.refresh()
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar preview */}
      <div className="relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-24 w-24 rounded-full object-cover border-2 border-border"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-border bg-[var(--awyc-primary)]/10">
            <User className="h-10 w-10 text-[var(--awyc-primary)]" />
          </div>
        )}

        {/* Upload overlay button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-[var(--awyc-primary)] text-white transition-colors hover:bg-[var(--awyc-primary-dark)] disabled:opacity-50"
          aria-label="Upload photo"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload button text */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-sm font-medium text-[var(--awyc-primary)] transition-colors hover:text-[var(--awyc-primary-dark)] disabled:opacity-50"
      >
        {uploading ? "Uploading..." : photoUrl ? "Change Photo" : "Upload Photo"}
      </button>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
