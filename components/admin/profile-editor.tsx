"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Check } from "lucide-react"

interface ProfileEditorProps {
  teamMemberId: string
  initialName: string
  initialEmail: string
}

export function ProfileEditor({ teamMemberId, initialName, initialEmail }: ProfileEditorProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [email, setEmail] = useState(initialEmail)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const hasChanges = name !== initialName || email !== initialEmail

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!hasChanges) return

    setError(null)
    setSaved(false)
    setSaving(true)

    try {
      const res = await fetch("/api/admin/profile/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberId, name, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to save changes.")
        return
      }

      setSaved(true)
      router.refresh()

      // Hide the "Saved" confirmation after 3 seconds
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Failed to save changes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="profile-name"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="profile-email"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Email
        </label>
        <input
          id="profile-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setSaved(false)
          }}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          required
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !hasChanges}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-6 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>

        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
            <Check className="h-4 w-4" />
            Saved
          </span>
        )}
      </div>
    </form>
  )
}
