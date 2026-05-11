"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Upload, FileCheck, Calendar, Eye, CheckCircle2 } from "lucide-react"

interface Task {
  id: string
  title: string
  description: string | null
  priority: "P1" | "P2" | "P3"
  status: string
  task_type: "approve" | "upload" | "schedule" | "review"
  due_date: string | null
  milestone_id: string | null
}

interface TaskCardListProps {
  tasks: Task[]
  currentMilestoneName: string
  schedulingUrl: string | null
}

const priorityConfig = {
  P1: { label: "P1", className: "bg-red-100 text-red-700" },
  P2: { label: "P2", className: "bg-amber-100 text-amber-700" },
  P3: { label: "P3", className: "bg-muted text-muted-foreground" },
}

function getDueDateDisplay(dueDate: string | null) {
  if (!dueDate) return null
  const [year, month, day] = dueDate.split("T")[0].split("-").map(Number)
  const due = Date.UTC(year, month - 1, day)
  const now = Date.UTC(
    new Date().getUTCFullYear(),
    new Date().getUTCMonth(),
    new Date().getUTCDate()
  )
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const formatted = `${monthNames[month - 1]} ${day}`

  if (diffDays < 0)
    return { label: `Overdue (${formatted})`, className: "text-red-600 font-medium" }
  if (diffDays <= 3)
    return { label: `Due ${formatted}`, className: "text-amber-600 font-medium" }
  return { label: `Due ${formatted}`, className: "text-muted-foreground" }
}

function ActionButton({
  task,
  schedulingUrl,
}: {
  task: Task
  schedulingUrl: string | null
}) {
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)

  function fireToast(msg: string) {
    setShowToast(msg)
    setTimeout(() => setShowToast(null), 3000)
  }

  const isPrimary = task.task_type === "approve" || task.task_type === "upload"
  const baseClass = isPrimary
    ? "bg-[var(--awyc-primary)] text-white hover:bg-[var(--awyc-primary-dark)]"
    : "border border-border bg-card text-foreground hover:bg-muted"

  const icons = {
    approve: FileCheck,
    upload: Upload,
    schedule: Calendar,
    review: Eye,
  }
  const labels = {
    approve: "Approve",
    upload: "Upload File",
    schedule: "Schedule Call",
    review: "Review",
  }
  const Icon = icons[task.task_type]

  function handleClick() {
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
        fireToast("Review functionality coming soon.")
        break
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors sm:h-auto sm:w-auto sm:justify-start sm:py-2",
          baseClass
        )}
      >
        <Icon className="h-4 w-4" />
        {labels[task.task_type]}
      </button>

      {/* Approve dialog */}
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
                onClick={() => {
                  setShowApproveDialog(false)
                  fireToast("Approved successfully!")
                }}
                className="flex-1 rounded-lg bg-[var(--awyc-primary)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--awyc-primary-dark)]"
              >
                Yes, Approve
              </button>
              <button
                type="button"
                onClick={() => setShowApproveDialog(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Upload File</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              PDF, DOCX, JPG, PNG, or ZIP. Max 10MB.
            </p>
            <div className="mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border px-6 py-10 text-center transition-colors hover:border-[var(--awyc-primary)]/40 hover:bg-muted/50">
              <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop your file here, or
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowUploadDialog(false)
                  fireToast("File uploaded successfully!")
                }}
                className="mt-2 text-sm font-medium text-[var(--awyc-primary)] hover:underline"
              >
                Browse Files
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowUploadDialog(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg bg-[var(--awyc-teal-success)] px-4 py-3 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {showToast}
        </div>
      )}
    </>
  )
}

export function TaskCardList({ tasks, currentMilestoneName, schedulingUrl }: TaskCardListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Tasks Waiting on You
        </h2>
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-[var(--awyc-teal-success)]" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            {"You're all caught up! We're working on "}
            <span className="font-medium text-foreground">{currentMilestoneName}</span>
            {" and will let you know when we need something from you."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Tasks Waiting on You
      </h2>
      <div className="flex flex-col gap-4">
        {tasks.map((task) => {
          const priority = priorityConfig[task.priority]
          const dueInfo = getDueDateDisplay(task.due_date)

          return (
            <div
              key={task.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-4"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-xs font-bold",
                      priority.className
                    )}
                  >
                    {priority.label}
                  </span>
                  <h3 className="text-base font-semibold text-foreground leading-tight md:text-lg">
                    {task.title}
                  </h3>
                </div>
                {task.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
                {dueInfo && (
                  <span className={cn("text-sm", dueInfo.className)}>{dueInfo.label}</span>
                )}
                <div className="w-full sm:w-auto">
                  <ActionButton task={task} schedulingUrl={schedulingUrl} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
