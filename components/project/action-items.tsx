"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Upload,
  FileCheck,
  Calendar,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  File as FileIcon,
} from "lucide-react"

interface Task {
  id: string
  title: string
  description: string | null
  priority: "P1" | "P2" | "P3"
  status: string
  task_type: "approve" | "upload" | "schedule" | "review"
  due_date: string | null
  milestone_id: string | null
  project_id: string
  projects?: { name: string } | null
  action_url?: string | null
  action_label?: string | null
}

interface ActionItemsProps {
  tasks: Task[]
  currentPhaseName: string
  statusNote?: string | null
  schedulingUrl?: string | null
  showProjectName?: boolean
  hasStarted?: boolean
}

const priorityConfig = {
  P1: { label: "P1", className: "bg-red-100 text-red-700" },
  P2: { label: "P2", className: "bg-amber-100 text-amber-700" },
  P3: { label: "P3", className: "bg-muted text-muted-foreground" },
}

function getDueDateInfo(dueDate: string | null): {
  label: string
  textClass: string
  borderClass: string
} {
  if (!dueDate)
    return {
      label: "",
      textClass: "text-muted-foreground",
      borderClass: "border-l-[var(--awyc-teal-success)]",
    }

  const [year, month, day] = dueDate.split("T")[0].split("-").map(Number)
  const due = Date.UTC(year, month - 1, day)
  const now = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  )
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
  ]
  const formatted = `${monthNames[month - 1]} ${day}`

  if (diffDays < 0) {
    return {
      label: `Overdue (${formatted})`,
      textClass: "text-red-600 font-medium",
      borderClass: "border-l-red-500",
    }
  }
  if (diffDays <= 3) {
    return {
      label: `Due ${formatted}`,
      textClass: "text-amber-600 font-medium",
      borderClass: "border-l-amber-500",
    }
  }
  return {
    label: `Due ${formatted}`,
    textClass: "text-[var(--awyc-teal-success)] font-medium",
    borderClass: "border-l-[var(--awyc-teal-success)]",
  }
}

function getCtaLabel(taskType: string) {
  switch (taskType) {
    case "approve": return "Approve"
    case "upload": return "Upload File"
    case "schedule": return "Schedule Call"
    case "review": return "Review"
    default: return "Take Action"
  }
}

const ctaIcons: Record<string, typeof FileCheck> = {
  approve: FileCheck,
  upload: Upload,
  schedule: Calendar,
  review: Eye,
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip,.xlsx,.csv,.txt"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ============================================================
   ActionButton — handles Upload, Approve, Schedule, Review
   ============================================================ */
function ActionButton({
  task,
  schedulingUrl,
}: {
  task: Task
  schedulingUrl: string | null
}) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)
  const [toastType, setToastType] = useState<"success" | "error">("success")

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Approve state
  const [approving, setApproving] = useState(false)

  function fireToast(msg: string, type: "success" | "error" = "success") {
    setToastType(type)
    setShowToast(msg)
    setTimeout(() => setShowToast(null), 4000)
  }

  function handleFileSelect(file: File) {
    if (file.size > MAX_FILE_SIZE) {
      fireToast("File exceeds 10MB limit.", "error")
      return
    }
    setSelectedFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("projectId", task.project_id)
      formData.append("taskId", task.id)
      formData.append("autoComplete", "true")

      const res = await fetch("/api/client/file/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      setShowUploadDialog(false)
      setSelectedFile(null)
      fireToast("File uploaded successfully!")
      router.refresh()
    } catch (err) {
      fireToast(
        err instanceof Error ? err.message : "Upload failed. Please try again.",
        "error"
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleApprove() {
    setApproving(true)
    try {
      const res = await fetch("/api/client/task/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          projectId: task.project_id,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Approval failed")
      }

      setShowApproveDialog(false)
      fireToast("Approved successfully!")
      router.refresh()
    } catch (err) {
      fireToast(
        err instanceof Error ? err.message : "Approval failed. Please try again.",
        "error"
      )
    } finally {
      setApproving(false)
    }
  }

  const isPrimary = task.task_type === "approve" || task.task_type === "upload"
  const baseClass = isPrimary
    ? "bg-[var(--awyc-primary)] text-white hover:bg-[var(--awyc-primary-dark)]"
    : "border border-border bg-card text-foreground hover:bg-muted"
  const Icon = ctaIcons[task.task_type] || AlertCircle

  function handleClick() {
    // If there's an action_url, navigate to it
    if (task.action_url) {
      if (task.action_url.startsWith("/")) {
        router.push(task.action_url)
      } else {
        window.open(task.action_url, "_blank", "noopener,noreferrer")
      }
      return
    }

    switch (task.task_type) {
      case "approve":
        setShowApproveDialog(true)
        break
      case "upload":
        setShowUploadDialog(true)
        break
      case "schedule":
        if (schedulingUrl) window.open(schedulingUrl, "_blank")
        break
      case "review":
        break
    }
  }

  const buttonLabel = task.action_url
    ? (task.action_label || "Review")
    : getCtaLabel(task.task_type)

  // Hide button for review tasks with no action_url
  if (task.task_type === "review" && !task.action_url) {
    return null
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors",
          baseClass
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {buttonLabel}
      </button>

      {/* ---- Approve Dialog ---- */}
      {showApproveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Approve?</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {"You're confirming that you've reviewed the deliverables and we're clear to proceed."}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={approving}
                onClick={handleApprove}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--awyc-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--awyc-primary-dark)] disabled:opacity-50"
              >
                {approving && <Loader2 className="h-4 w-4 animate-spin" />}
                {approving ? "Approving..." : "Yes, Approve"}
              </button>
              <button
                type="button"
                disabled={approving}
                onClick={() => setShowApproveDialog(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Upload Dialog ---- */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Upload File</h3>
              <button
                type="button"
                onClick={() => { setShowUploadDialog(false); setSelectedFile(null) }}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF, DOCX, JPG, PNG, ZIP, XLSX, CSV, or TXT. Max 10MB.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors",
                dragOver
                  ? "border-[var(--awyc-primary)] bg-[var(--awyc-primary)]/5"
                  : "border-border hover:border-[var(--awyc-primary)]/40 hover:bg-muted/50"
              )}
            >
              {selectedFile ? (
                <div className="flex items-center gap-3">
                  <FileIcon className="h-8 w-8 text-[var(--awyc-primary)]" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="ml-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop your file here, or
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm font-medium text-[var(--awyc-primary)] hover:underline"
                  >
                    Browse Files
                  </button>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
                e.target.value = "" // allow re-selecting the same file
              }}
            />

            {/* Action buttons */}
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowUploadDialog(false); setSelectedFile(null) }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
                className="flex items-center gap-2 rounded-lg bg-[var(--awyc-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--awyc-primary-dark)] disabled:opacity-50"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Toast ---- */}
      {showToast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg",
            toastType === "success"
              ? "bg-[var(--awyc-teal-success)]"
              : "bg-red-600"
          )}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {showToast}
        </div>
      )}
    </>
  )
}

/* ============================================================
   ActionItems — main export
   ============================================================ */
export function ActionItems({
  tasks,
  currentPhaseName,
  statusNote,
  schedulingUrl,
  showProjectName = false,
  hasStarted = true,
}: ActionItemsProps) {
  if (tasks.length === 0) {
    const title = hasStarted ? "All Caught Up" : "All Set"
    const message = hasStarted
      ? statusNote
        ? `Nothing needed from you right now. ${statusNote}`
        : `Nothing needed from you right now. We're working on ${currentPhaseName} and will reach out when we need you.`
      : "We're getting everything ready on our end. We'll notify you when there's something to review."

    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--awyc-teal-success)]"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--awyc-teal-success)]">
              {title}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {message}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Action Items ({tasks.length})
      </h2>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => {
          const priority = priorityConfig[task.priority] || priorityConfig.P3
          const dueInfo = getDueDateInfo(task.due_date)

          return (
            <div
              key={task.id}
              className={cn(
                "flex flex-col gap-2.5 rounded-lg border border-border border-l-[3px] p-4",
                dueInfo.borderClass
              )}
            >
              {/* Title row: priority badge + title */}
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-bold",
                    priority.className
                  )}
                >
                  {priority.label}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground leading-tight">
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Meta row: project name, due date, action button */}
              <div className="flex flex-wrap items-center gap-2 pl-7">
                {showProjectName && task.projects?.name && (
                  <span className="text-xs text-muted-foreground">
                    {task.projects.name}
                  </span>
                )}
                {showProjectName && task.projects?.name && dueInfo.label && (
                  <span className="text-muted-foreground/40">&middot;</span>
                )}
                {dueInfo.label && (
                  <span className={cn("text-xs", dueInfo.textClass)}>
                    {dueInfo.label}
                  </span>
                )}
                <div className="ml-auto">
                  <ActionButton task={task} schedulingUrl={schedulingUrl || null} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
