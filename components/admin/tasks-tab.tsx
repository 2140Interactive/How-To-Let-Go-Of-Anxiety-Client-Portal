"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react"
import { formatDate } from "@/lib/utils/format"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Task {
  id: string
  title: string
  description: string | null
  task_type: string
  priority: string
  status: string
  due_date: string | null
  assigned_to: string
  is_priority_action?: boolean
  action_url?: string | null
  action_label?: string | null
}

interface TasksTabProps {
  tasks: Task[]
  projectId: string
  clientName?: string
}

const typeOptions = ["upload", "approve", "review", "schedule"]
const priorityOptions = ["P1", "P2", "P3"]
const filterOptions = ["all", "pending", "completed"] as const

const priorityBadge: Record<string, string> = {
  P1: "bg-red-100 text-red-700",
  P2: "bg-amber-100 text-amber-700",
  P3: "bg-blue-100 text-blue-700",
}

const statusBadge: Record<string, string> = {
  todo: "bg-amber-100 text-amber-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
}

export function TasksTab({ tasks, projectId, clientName }: TasksTabProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<(typeof filterOptions)[number]>("all")
  const [showDialog, setShowDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)

  const filtered = tasks.filter((t) => {
    if (filter === "pending") return t.status !== "completed"
    if (filter === "completed") return t.status === "completed"
    return true
  })

  function openCreate() {
    setEditingTask(null)
    setShowDialog(true)
  }

  function openEdit(task: Task) {
    setEditingTask(task)
    setShowDialog(true)
  }

  async function handleDelete(task: Task) {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/task/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          projectId,
          taskTitle: task.title,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Task deleted")
      setDeleteConfirm(null)
      router.refresh()
    } catch {
      toast.error("Failed to delete task")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Client context */}
      {clientName && (
        <p className="text-sm text-muted-foreground">
          Client: <span className="font-medium text-foreground">{clientName}</span>
        </p>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {filterOptions.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "bg-amber-500 text-white"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600"
        >
          <Plus className="h-4 w-4" />
          Create Task
        </button>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks match this filter.
          </p>
        )}
        {filtered.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-xs font-bold",
                        priorityBadge[task.priority] || "bg-muted text-foreground"
                      )}
                    >
                      {task.priority}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize text-muted-foreground">
                      {task.task_type}
                    </span>
                    {task.is_priority_action && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        Priority Action
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-foreground">
                      {task.title}
                    </h3>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {task.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(task)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Edit task"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(task)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 font-medium capitalize",
                    statusBadge[task.status] || "bg-muted text-foreground"
                  )}
                >
                  {task.status === "todo" ? "Pending" : task.status.replace("_", " ")}
                </span>
                {task.due_date && (
                  <span className="text-muted-foreground">
                    Due: {formatDate(task.due_date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <TaskDialog
          projectId={projectId}
          task={editingTask}
          clientName={clientName}
          onClose={() => setShowDialog(false)}
          onSaved={() => {
            setShowDialog(false)
            router.refresh()
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Delete Task?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {"Are you sure you want to delete this task? The client will no longer see it."}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirm)}
                disabled={saving}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---- Task Dialog (Create / Edit) ---- */

function TaskDialog({
  projectId,
  task,
  clientName,
  onClose,
  onSaved,
}: {
  projectId: string
  task: Task | null
  clientName?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [type, setType] = useState(task?.task_type || "upload")
  const [priority, setPriority] = useState(task?.priority || "P2")
  const [dueDate, setDueDate] = useState(task?.due_date?.split("T")[0] || "")
  const [isPriority, setIsPriority] = useState(task?.is_priority_action || false)
  const [actionUrl, setActionUrl] = useState(task?.action_url || "")
  const [actionLabel, setActionLabel] = useState(task?.action_label || "")
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const isEdit = !!task
      const url = isEdit ? "/api/admin/task/update" : "/api/admin/task/create"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit ? { taskId: task.id } : {}),
          projectId,
          title,
          description,
          type,
          priority,
          dueDate: dueDate || null,
          isPriorityAction: isPriority,
          actionUrl: actionUrl.trim() || null,
          actionLabel: actionLabel.trim() || null,
        }),
      })

      if (!res.ok) throw new Error()
      toast.success(isEdit ? "Task updated" : "Task created")
      onSaved()
      onClose()
    } catch {
      toast.error("Failed to save task")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            {task ? "Edit Task" : "Create Task"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {clientName && (
          <p className="mt-3 text-xs text-muted-foreground">
            Client: <span className="font-medium text-foreground">{clientName}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Type
              </label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-10 w-full capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Due Date *
            </label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPriority}
              onChange={(e) => setIsPriority(e.target.checked)}
              className="h-4 w-4 rounded border-border text-amber-500 focus:ring-amber-500/40"
            />
            <span className="text-sm text-foreground">
              Is Priority Action (shows in client banner)
            </span>
          </label>

          {/* Action Link */}
          <div className="rounded-lg border border-dashed border-border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Action Link (optional)
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Action URL
                </label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="https://... or /project/abc?tab=files"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Button Label
                </label>
                <input
                  type="text"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="Review (default if left blank)"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
