"use client"

import { AlertCircle, Upload, Calendar, FileCheck, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface PriorityAction {
  id: string
  title: string
  description: string | null
  task_type: string
  due_date: string | null
  projects: { name: string } | null
}

interface PriorityActionBannerProps {
  actions: PriorityAction[]
}

function getDueDateInfo(dueDate: string | null) {
  if (!dueDate) return { label: "", className: "text-muted-foreground" }

  // Parse date parts directly from the ISO string to avoid timezone shifts
  // between server and client that cause hydration mismatches
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

  if (diffDays < 0) {
    return { label: `Overdue (${formatted})`, className: "text-destructive font-medium" }
  }
  if (diffDays <= 3) {
    return { label: `Due ${formatted}`, className: "text-amber-600 font-medium" }
  }
  return { label: `Due ${formatted}`, className: "text-muted-foreground" }
}

function getCtaLabel(taskType: string) {
  switch (taskType) {
    case "approve":
      return "Approve Now"
    case "upload":
      return "Upload File"
    case "schedule":
      return "Schedule Call"
    case "review":
      return "Review Now"
    default:
      return "Take Action"
  }
}

function getCtaIcon(taskType: string) {
  switch (taskType) {
    case "approve":
      return FileCheck
    case "upload":
      return Upload
    case "schedule":
      return Calendar
    case "review":
      return Eye
    default:
      return AlertCircle
  }
}

export function PriorityActionBanner({ actions }: PriorityActionBannerProps) {
  if (!actions || actions.length === 0) return null

  const primary = actions[0]
  const remaining = actions.length - 1
  const dueDateInfo = getDueDateInfo(primary.due_date)
  const CtaIcon = getCtaIcon(primary.task_type)

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex border-l-4 border-l-[var(--awyc-primary)]">
        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--awyc-primary)]/10">
              <AlertCircle className="h-4 w-4 text-[var(--awyc-primary)]" />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <h3 className="text-lg font-semibold text-foreground leading-tight">
                {primary.title}
              </h3>
              {primary.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {primary.description}
                </p>
              )}
              {primary.projects?.name && (
                <p className="text-xs text-muted-foreground">
                  {primary.projects.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pl-11">
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[var(--awyc-primary)] px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[var(--awyc-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CtaIcon className="h-4 w-4" />
              {getCtaLabel(primary.task_type)}
            </button>
            <span className={cn("text-sm", dueDateInfo.className)}>
              {dueDateInfo.label}
            </span>
          </div>

          {remaining > 0 && (
            <p className="pl-11 text-sm text-muted-foreground">
              <span className="font-medium text-[var(--awyc-primary)]">
                {remaining} more {remaining === 1 ? "action needs" : "actions need"} your attention
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
