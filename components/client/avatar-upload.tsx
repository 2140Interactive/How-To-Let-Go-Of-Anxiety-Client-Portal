"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Camera, Loader2 } from "lucide-react"

interface ClientAvatarUploadProps {
  currentUrl: string | null
  initials: string
}

export function ClientAvatarUpload({ currentUrl, initials }: ClientAvatarUploadProps) {
  const router = useRouter()
  const [avatarUrl, setAvatarUrl] = useState(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/client/avatar/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Upload failed")
        return
      }

      setAvatarUrl(data.url)
      // Refresh the server layout so the header avatar re-fetches photo_url
      router.refresh()
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted transition-colors hover:border-primary"
        disabled={uploading}
        aria-label="Upload avatar"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt="Your avatar"
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <span className="text-lg font-semibold text-muted-foreground">
            {initials}
          </span>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleUpload}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">Click to upload</p>
    </div>
  )
}
