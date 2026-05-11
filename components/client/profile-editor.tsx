"use client"

import { useState } from "react"
import { Pencil, Check, X, Loader2 } from "lucide-react"

interface ClientProfileEditorProps {
  firstName: string
  lastName: string
}

export function ClientProfileEditor({ firstName, lastName }: ClientProfileEditorProps) {
  const [editing, setEditing] = useState(false)
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!first.trim()) {
      setError("First name is required")
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/client/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: first, last_name: last }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Update failed")
        return
      }

      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Update failed. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFirst(firstName)
    setLast(lastName)
    setEditing(false)
    setError(null)
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">
          {first} {last}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Edit name"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {saved && (
          <span className="text-xs text-[var(--awyc-teal-success)]">Saved</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          placeholder="First name"
          className="h-8 w-32 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          autoFocus
        />
        <input
          type="text"
          value={last}
          onChange={(e) => setLast(e.target.value)}
          placeholder="Last name"
          className="h-8 w-32 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md p-1 text-[var(--awyc-teal-success)] transition-colors hover:bg-accent"
          aria-label="Save"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
