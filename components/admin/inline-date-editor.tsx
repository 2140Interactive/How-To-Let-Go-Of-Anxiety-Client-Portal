"use client"

import { useState, useRef } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils/format"

interface InlineDateEditorProps {
  label: string
  value: string | null
  field: "startDate" | "estimatedEndDate"
  projectId: string
}

export function InlineDateEditor({ label, value, field, projectId }: InlineDateEditorProps) {
  const [currentValue, setCurrentValue] = useState(value)
  const [saving, setSaving] = useState(false)
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = currentValue ? formatDate(currentValue) : "Not set"

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value
    if (!newDate) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/project/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          [field]: newDate,
        }),
      })
      if (!res.ok) throw new Error()
      setCurrentValue(newDate)
      toast.success(`${label} updated`)
    } catch {
      toast.error(`Failed to update ${label}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <span
      className="relative inline-flex items-center gap-1 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => inputRef.current?.showPicker?.()}
      title={`Edit ${label}`}
    >
      <span className={saving ? "opacity-50" : ""}>{label}: {displayValue}</span>
      <Pencil
        className="transition-opacity"
        style={{
          width: 12,
          height: 12,
          opacity: hovered ? 1 : 0,
          color: "var(--muted-foreground)",
        }}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="date"
        value={currentValue?.split("T")[0] || ""}
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        aria-label={`Edit ${label}`}
        tabIndex={-1}
      />
    </span>
  )
}
