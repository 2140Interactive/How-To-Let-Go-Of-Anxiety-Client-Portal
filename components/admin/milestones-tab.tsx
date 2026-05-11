"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { MilestoneRoadmap } from "@/components/project/milestone-roadmap"
import { Save, Loader2, ChevronDown, Play, CalendarClock, Clock, Plus, Trash2, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Milestone {
  id: string
  name: string
  short_label: string
  description: string | null
  order: number
  status: "completed" | "in_progress" | "upcoming" | "blocked" | "revision"
  expected_completion_date: string | null
  completed_at: string | null
  status_note?: string | null
}

interface MilestonesTabProps {
  milestones: Milestone[]
  projectId: string
  projectStatus?: string
}

const statusOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
  { value: "revision", label: "Revision" },
]

const projectStatusOptions = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
]

const activeStatusConfig = {
  in_progress: {
    bg: "bg-blue-50",
    border: "border-l-[var(--awyc-primary)]",
    badgeBg: "bg-blue-100 text-blue-800",
    label: "In Progress",
  },
  upcoming: {
    bg: "bg-white",
    border: "border-l-gray-300",
    badgeBg: "bg-gray-100 text-gray-600",
    label: "Upcoming",
  },
  blocked: {
    bg: "bg-red-50",
    border: "border-l-red-500",
    badgeBg: "bg-red-100 text-red-800",
    label: "Blocked",
  },
  revision: {
    bg: "bg-amber-50",
    border: "border-l-amber-500",
    badgeBg: "bg-amber-100 text-amber-800",
    label: "Revision",
  },
} as const

function formatAccordionDate(dateString: string | null): string {
  if (!dateString) return "\u2014"
  const [year, month, day] = dateString.split("T")[0].split("-").map(Number)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${monthNames[month - 1]} ${day}, ${year}`
}

export function MilestonesTab({ milestones, projectId, projectStatus = "new" }: MilestonesTabProps) {
  const router = useRouter()
  const [projectStatusLocal, setProjectStatusLocal] = useState(projectStatus)
  const [projectStatusSaving, setProjectStatusSaving] = useState(false)

  useEffect(() => {
    setProjectStatusLocal(projectStatus)
  }, [projectStatus])

  const activeMilestones = milestones.filter(
    (m) => m.status === "in_progress" || m.status === "upcoming" || m.status === "blocked" || m.status === "revision"
  )
  const completedMilestones = milestones.filter((m) => m.status === "completed")
  const completedCount = completedMilestones.length
  const totalCount = milestones.length

  const inProgressId = milestones.find((m) => m.status === "in_progress")?.id || null
  const [expandedId, setExpandedId] = useState<string | null>(inProgressId)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [completedExpandedId, setCompletedExpandedId] = useState<string | null>(null)

  const [editState, setEditState] = useState<
    Record<string, { status?: string; statusNote?: string; expectedDate?: string }>
  >({})
  const [saving, setSaving] = useState<string | null>(null)

  // Phase transition state
  const [transitionMilestoneId, setTransitionMilestoneId] = useState<string | null>(null)
  const [transitionDate, setTransitionDate] = useState("")
  const [transitionSaving, setTransitionSaving] = useState(false)

  // Add milestone state
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newShortLabel, setNewShortLabel] = useState("")
  const [newOrder, setNewOrder] = useState<number | null>(null)
  const [addingSaving, setAddingSaving] = useState(false)

  // Delete milestone state
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Edit milestone dialog state
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editForm, setEditForm] = useState({ name: "", shortLabel: "", description: "", order: 1 })
  const [editSaving, setEditSaving] = useState(false)

  const currentMilestone = milestones.find((m) => m.status === "in_progress")

  async function handleProjectStatusChange(newStatus: string) {
    setProjectStatusLocal(newStatus)
    setProjectStatusSaving(true)
    try {
      const res = await fetch("/api/admin/project/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          status: newStatus,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Project status updated")
      router.refresh()
    } catch {
      toast.error("Failed to update project status")
      setProjectStatusLocal(projectStatus)
    } finally {
      setProjectStatusSaving(false)
    }
  }

  async function handleAddMilestone() {
    if (!newName.trim() || !newShortLabel.trim()) return
    setAddingSaving(true)
    try {
      const nextOrder = newOrder !== null ? newOrder : (milestones.length > 0 ? Math.max(...milestones.map((m) => m.order)) + 1 : 1)
      const res = await fetch("/api/admin/milestone/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: newName.trim(),
          shortLabel: newShortLabel.trim(),
          order: nextOrder,
        }),
      })
      if (!res.ok) throw new Error("Failed to add milestone")
      toast.success(`${newName.trim()} added`)
      setNewName("")
      setNewShortLabel("")
      setNewOrder(null)
      setShowAddForm(false)
      router.refresh()
    } catch {
      toast.error("Failed to add milestone")
    } finally {
      setAddingSaving(false)
    }
  }

  async function handleDeleteMilestone(m: Milestone) {
    setDeletingId(m.id)
    try {
      const res = await fetch("/api/admin/milestone/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: m.id,
          projectId,
        }),
      })
      if (!res.ok) throw new Error("Failed to delete milestone")
      toast.success(`${m.name} removed`)
      setConfirmDeleteId(null)
      router.refresh()
    } catch {
      toast.error("Failed to delete milestone")
    } finally {
      setDeletingId(null)
    }
  }

  function openEditDialog(m: Milestone) {
    setEditingMilestone(m)
    setEditForm({
      name: m.name,
      shortLabel: m.short_label,
      description: m.description || "",
      order: m.order,
    })
  }

  async function handleEditSave() {
    if (!editingMilestone || !editForm.name.trim() || !editForm.shortLabel.trim()) return
    setEditSaving(true)
    try {
      const res = await fetch("/api/admin/milestone/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: editingMilestone.id,
          projectId,
          name: editForm.name.trim(),
          shortLabel: editForm.shortLabel.trim(),
          description: editForm.description.trim() || null,
          order: editForm.order,
        }),
      })
      if (!res.ok) throw new Error("Failed to update milestone")
      toast.success(`${editForm.name.trim()} updated`)
      setEditingMilestone(null)
      router.refresh()
    } catch {
      toast.error("Failed to update milestone")
    } finally {
      setEditSaving(false)
    }
  }

  function handleChange(id: string, field: string, value: string) {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  function hasChanges(m: Milestone) {
    const edits = editState[m.id]
    if (!edits) return false
    return (
      (edits.status !== undefined && edits.status !== m.status) ||
      (edits.statusNote !== undefined && edits.statusNote !== (m.status_note || "")) ||
      (edits.expectedDate !== undefined && edits.expectedDate !== (m.expected_completion_date?.split("T")[0] || ""))
    )
  }

  async function handleSave(m: Milestone) {
    const edits = editState[m.id]
    if (!edits) return

    setSaving(m.id)
    try {
      const res = await fetch("/api/admin/milestone/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: m.id,
          projectId,
          status: edits.status ?? m.status,
          statusNote: edits.statusNote ?? undefined,
          expectedDate: edits.expectedDate === "" ? null : (edits.expectedDate ?? undefined),
        }),
      })
      if (!res.ok) throw new Error("Failed to update milestone")
      toast.success(`${m.name} updated`)
      setEditState((prev) => {
        const next = { ...prev }
        delete next[m.id]
        return next
      })

      // Check if this milestone was just completed -> show transition panel
      const savedStatus = edits.status ?? m.status
      if (savedStatus === "completed") {
        const currentIndex = milestones.findIndex((ms) => ms.id === m.id)
        const nextMilestone = milestones[currentIndex + 1]
        if (nextMilestone && nextMilestone.status !== "completed") {
          setTransitionMilestoneId(nextMilestone.id)
          return // Don't refresh yet - show transition panel first
        }
      }

      router.refresh()
    } catch {
      toast.error("Failed to update milestone")
    } finally {
      setSaving(null)
    }
  }

  // Transition panel actions
  const transitionMilestone = transitionMilestoneId
    ? milestones.find((m) => m.id === transitionMilestoneId)
    : null

  async function handleStartNow() {
    if (!transitionMilestone) return
    setTransitionSaving(true)
    try {
      const res = await fetch("/api/admin/milestone/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: transitionMilestone.id,
          projectId,
          status: "in_progress",
        }),
      })
      if (!res.ok) throw new Error("Failed to start milestone")
      toast.success(`${transitionMilestone.name} started`)
      setExpandedId(transitionMilestone.id)
      setTransitionMilestoneId(null)
      router.refresh()
    } catch {
      toast.error("Failed to start milestone")
    } finally {
      setTransitionSaving(false)
    }
  }

  async function handleScheduleStart() {
    if (!transitionMilestone || !transitionDate) return
    setTransitionSaving(true)
    try {
      const res = await fetch("/api/admin/milestone/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          milestoneId: transitionMilestone.id,
          projectId,
          status: "in_progress",
          expectedDate: transitionDate,
        }),
      })
      if (!res.ok) throw new Error("Failed to start milestone")
      toast.success(`${transitionMilestone.name} started`)
      setTransitionMilestoneId(null)
      setTransitionDate("")
      router.refresh()
    } catch {
      toast.error("Failed to start milestone")
    } finally {
      setTransitionSaving(false)
    }
  }

  function handleNotYet() {
    setTransitionMilestoneId(null)
    setTransitionDate("")
    router.refresh()
  }

  function renderEditControls(m: Milestone) {
    const edits = editState[m.id] || {}
    const currentStatus = (edits.status ?? m.status) as string
    const isInProgress = currentStatus === "in_progress"
    const changed = hasChanges(m)

    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Status */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={currentStatus}
              onValueChange={(val) => handleChange(m.id, "status", val)}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expected Date */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Expected Date</label>
            <input
              type="date"
              value={edits.expectedDate ?? (m.expected_completion_date?.split("T")[0] || "")}
              onChange={(e) => handleChange(m.id, "expectedDate", e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Completed Date (read-only) */}
          {m.completed_at && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Completed</label>
              <p className="flex h-10 items-center text-sm text-foreground">
                {new Date(m.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        {/* Status note */}
        {isInProgress && (
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">{"What's Happening Now"}</label>
            <textarea
              rows={3}
              placeholder="Tell the client what you're working on right now..."
              value={edits.statusNote ?? (m.status_note || "")}
              onChange={(e) => handleChange(m.id, "statusNote", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
        )}

        {/* Actions row */}
        <div className="flex items-center justify-between">
          {/* Edit & Delete */}
          <div className="flex items-center gap-2">
            {confirmDeleteId === m.id ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600">Remove this milestone?</span>
                <button
                  type="button"
                  onClick={() => handleDeleteMilestone(m)}
                  disabled={deletingId === m.id}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {deletingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openEditDialog(m)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(m.id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </>
            )}
          </div>

          {/* Save */}
          {changed && (
            <button
              type="button"
              onClick={() => handleSave(m)}
              disabled={saving === m.id}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
            >
              {saving === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          )}
        </div>
      </div>
    )
  }

  function renderTransitionPanel() {
    if (!transitionMilestone) return null

    return (
      <div className="border-t border-border bg-[var(--awyc-teal-success)]/5 px-4 py-5 md:px-5">
        <p className="text-sm font-bold text-foreground">
          {"Phase Complete! What's next for "}
          {transitionMilestone.name}?
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {/* Button 1: Start Now */}
          <button
            type="button"
            onClick={handleStartNow}
            className="flex items-start gap-3 rounded-lg border border-[var(--awyc-teal-success)] bg-[var(--awyc-teal-success)]/10 px-4 py-3 text-left transition-colors hover:bg-[var(--awyc-teal-success)]/20"
          >
            <Play className="mt-0.5 h-4 w-4 shrink-0 text-[var(--awyc-teal-success)]" />
            <div>
              <p className="text-sm font-medium text-foreground">Start {transitionMilestone.name} Now</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Begin this phase immediately. You can set the expected date and add a status note.
              </p>
            </div>
          </button>

          {/* Button 2: Schedule Start Date */}
          <div className="flex flex-col rounded-lg border border-border bg-background px-4 py-3">
            <button
              type="button"
              onClick={() => {
                if (!transitionDate) {
                  // Show date picker by focusing - set a default so the section renders
                  setTransitionDate(new Date().toISOString().split("T")[0])
                }
              }}
              className="flex items-start gap-3 text-left"
            >
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Schedule Start Date</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Set a future start date for this phase.
                </p>
              </div>
            </button>

            {transitionDate !== "" && (
              <div className="mt-3 flex items-end gap-3 pl-7">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Phase starts on:</label>
                  <input
                    type="date"
                    value={transitionDate}
                    onChange={(e) => setTransitionDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleScheduleStart}
                  disabled={transitionSaving || !transitionDate}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  {transitionSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                </button>
              </div>
            )}
          </div>

          {/* Button 3: Not Yet */}
          <button
            type="button"
            onClick={handleNotYet}
            className="flex items-start gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-muted/50"
          >
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Not Yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Keep as upcoming. You will be reminded if no phase is active for 48 hours.
              </p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Status dropdown */}
      <div className="flex items-end gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Status</label>
          <div className="flex items-center gap-2">
            <Select value={projectStatusLocal} onValueChange={handleProjectStatusChange} disabled={projectStatusSaving}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectStatusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projectStatusSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Updates automatically based on milestone progress. Manual override available for exceptions.</p>
        </div>
      </div>

      {/* Visual roadmap */}
      <MilestoneRoadmap
        milestones={milestones}
        currentPhaseName={currentMilestone?.name}
        statusNote={currentMilestone?.status_note}
      />

      {/* Active & Upcoming */}
      {activeMilestones.length > 0 && (
        <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border shadow-sm">
          <div className="px-4 py-3 md:px-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active & Upcoming
            </span>
          </div>
          {activeMilestones.map((m, index) => {
            const edits = editState[m.id] || {}
            const currentStatus = (edits.status ?? m.status) as keyof typeof activeStatusConfig
            const config = activeStatusConfig[currentStatus] || activeStatusConfig.upcoming
            const isExpanded = expandedId === m.id
            const isFirst = index === 0
            const isLast = index === activeMilestones.length - 1

            return (
              <div key={m.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId((prev) => (prev === m.id ? null : m.id))}
                  className={cn(
                    "flex w-full items-center gap-3 border-l-[3px] px-4 py-3 text-left transition-colors hover:bg-muted/50 md:px-5",
                    config.bg,
                    config.border,
                    !isFirst && "border-t border-t-border",
                    isFirst && "rounded-t-xl",
                    isLast && !isExpanded && "rounded-b-xl"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="text-sm font-semibold text-foreground">{milestones.indexOf(m) + 1}. {m.name}</span>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", config.badgeBg)}>
                      {config.label}
                    </span>
                  </div>
                  {m.expected_completion_date && (
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                      {formatAccordionDate(m.expected_completion_date)}
                    </span>
                  )}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isExpanded && "rotate-180"
                    )}
                  />
                </button>

                {isExpanded && (
                  <div
                    className={cn(
                      "border-l-[3px] border-t border-t-border px-4 py-4 md:px-5",
                      config.border,
                      isLast && !transitionMilestoneId && "rounded-b-xl"
                    )}
                  >
                    {renderEditControls(m)}
                  </div>
                )}

                {/* Transition panel appears after the milestone that triggered it */}
                {transitionMilestoneId === m.id && renderTransitionPanel()}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Milestone */}
      <div>
        {showAddForm ? (
          <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <div className="px-4 py-3 md:px-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Add Milestone
              </span>
            </div>
            <div className="border-t border-border px-4 py-4 md:px-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Design Review"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Short Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Design"
                    value={newShortLabel}
                    onChange={(e) => setNewShortLabel(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Order (optional)</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Leave blank to append at end"
                    value={newOrder !== null ? newOrder : ""}
                    onChange={(e) => setNewOrder(e.target.value ? parseInt(e.target.value) : null)}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Lower numbers appear first. Existing milestones auto-shift.</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewName("")
                    setNewShortLabel("")
                    setNewOrder(null)
                  }}
                  className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  disabled={addingSaving || !newName.trim() || !newShortLabel.trim()}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                >
                  {addingSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add Milestone
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-amber-500/50 hover:bg-amber-50 hover:text-amber-700"
          >
            <Plus className="h-4 w-4" />
            Add Milestone
          </button>
        )}
      </div>

      {/* Completed */}
      {completedMilestones.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <button
            type="button"
            onClick={() => setCompletedOpen((prev) => !prev)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30 md:px-5"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completed ({completedCount} of {totalCount})
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                completedOpen && "rotate-180"
              )}
            />
          </button>

          {completedOpen && (
            <div className="flex flex-col gap-0">
              {completedMilestones.map((m, index) => {
                const isExpanded = completedExpandedId === m.id
                const isLast = index === completedMilestones.length - 1

                return (
                  <div key={m.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setCompletedExpandedId((prev) => (prev === m.id ? null : m.id))
                      }
                      className="flex w-full items-center gap-3 border-l-[3px] border-l-gray-200 border-t border-t-border px-4 py-2.5 text-left transition-colors hover:bg-muted/30 md:px-5"
                    >
                      <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                        {milestones.indexOf(m) + 1}. {m.name}
                      </span>
                      {m.completed_at && (
                        <span className="shrink-0 text-xs text-muted-foreground/70">
                          {new Date(m.completed_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                      />
                    </button>

                    {isExpanded && (
                      <div
                        className={cn(
                          "border-l-[3px] border-l-gray-200 border-t border-t-border/50 bg-muted/20 px-4 py-4 md:px-5",
                          isLast && "rounded-b-xl"
                        )}
                      >
                        {renderEditControls(m)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Milestone Dialog */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setEditingMilestone(null)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Edit Milestone</h3>
              <button
                type="button"
                onClick={() => setEditingMilestone(null)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  placeholder="e.g., Discovery & Planning"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Short Label</label>
                <input
                  type="text"
                  value={editForm.shortLabel}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, shortLabel: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  placeholder="e.g., Discovery"
                />
                <p className="mt-1 text-xs text-muted-foreground">Displayed in the roadmap progress bar</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Description (optional)</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  placeholder="What happens in this phase..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Order</label>
                <input
                  type="number"
                  min={1}
                  value={editForm.order}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  className="h-10 w-24 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
                <p className="mt-1 text-xs text-muted-foreground">Change to reorder. Lower numbers appear first.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingMilestone(null)}
                className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSaving || !editForm.name.trim() || !editForm.shortLabel.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
              >
                {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
