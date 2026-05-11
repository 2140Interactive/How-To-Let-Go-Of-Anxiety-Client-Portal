"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Plus, X, Loader2, MessageSquare, Zap } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils/format"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Activity {
  id: string
  type: string
  title: string
  description: string | null
  created_at: string
}

interface ActivityTabProps {
  activities: Activity[]
  projectId: string
}

const activityIcons: Record<string, string> = {
  milestone_completed: "bg-[var(--awyc-teal-success)]",
  task_created: "bg-blue-500",
  document_uploaded: "bg-purple-500",
  payment_received: "bg-green-500",
  message: "bg-[var(--awyc-primary)]",
}

const typeOptions = [
  { value: "message", label: "Message" },
  { value: "milestone_completed", label: "Milestone Completed" },
  { value: "task_created", label: "Task Created" },
  { value: "document_uploaded", label: "Document Uploaded" },
  { value: "payment_received", label: "Payment Received" },
]

export function ActivityTab({ activities, projectId }: ActivityTabProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const DEFAULT_VISIBLE = 5
  const hasMore = activities.length > DEFAULT_VISIBLE
  const visibleActivities = expanded ? activities : activities.slice(0, DEFAULT_VISIBLE)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600"
        >
          <Plus className="h-4 w-4" />
          Post Update
        </button>
      </div>

      {/* Activity list */}
      <div className="rounded-xl border border-border bg-card shadow-sm">
        {activities.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No activity yet.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {visibleActivities.map((a) => {
              const isManual = a.type === "message"
              return (
                <div key={a.id} className="flex gap-3 px-4 py-3 md:px-6">
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      activityIcons[a.type] || "bg-muted"
                    )}
                  >
                    {isManual ? (
                      <MessageSquare className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{a.title}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-xs",
                            isManual
                              ? "bg-amber-100 text-amber-700"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {isManual ? "Manual" : "Auto"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(a.created_at)}
                        </span>
                      </div>
                    </div>
                    {a.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                        {a.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full border-t border-border px-4 py-3 text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {expanded ? "Show Less" : `View All Activity (${activities.length})`}
          </button>
        )}
      </div>

      {showDialog && (
        <PostUpdateDialog
          projectId={projectId}
          onClose={() => setShowDialog(false)}
          onSaved={() => {
            setShowDialog(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function PostUpdateDialog({
  projectId,
  onClose,
  onSaved,
}: {
  projectId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("message")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/activity/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title, description, type }),
      })
      if (!res.ok) throw new Error()
      toast.success("Update posted")
      onSaved()
    } catch {
      toast.error("Failed to post update")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Post Update</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Progress update"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Message</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What would you like the client to know?"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Post
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
