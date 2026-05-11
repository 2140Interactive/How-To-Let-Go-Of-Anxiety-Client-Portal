"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SettingsTabProps {
  project: {
    id: string
    name: string
    status: string
    project_type: string | null
    description: string | null
    health_override: string | null
  }
}

const statusOptions = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
]

const healthOptions = [
  { value: "on_track", label: "On Track" },
  { value: "behind_schedule", label: "Behind Schedule" },
  { value: "at_risk", label: "At Risk" },
]

export function SettingsTab({ project }: SettingsTabProps) {
  const router = useRouter()
  const [name, setName] = useState(project.name)
  const [status, setStatus] = useState(project.status)
  const [projectType, setProjectType] = useState(project.project_type || "")
  const [description, setDescription] = useState(project.description || "")
  const [healthOverride, setHealthOverride] = useState(project.health_override || "on_track")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/project/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          name,
          status,
          projectType,
          description,
          healthOverride,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Project settings saved")
      router.refresh()
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Project Settings
        </h3>

        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Project Type</label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="build">Build</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        </div>
      </div>

      {/* Health Status */}
      <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:w-1/2 md:px-6">
        <h3 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Health Status
        </h3>

        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Health Status
          </label>
          <Select value={healthOverride} onValueChange={setHealthOverride}>
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {healthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-6 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>
    </form>
  )
}
