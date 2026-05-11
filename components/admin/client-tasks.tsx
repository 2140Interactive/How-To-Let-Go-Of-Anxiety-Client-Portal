import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"

interface Task {
  id: string
  title: string
  priority: string | null
  status: string
  due_date: string | null
  project_id: string
  projects: {
    name: string
    id: string
    clients: {
      first_name: string
      last_name: string
    }
  }
}

interface ClientTasksProps {
  tasks: Task[]
}

function getPriorityBadge(priority: string | null) {
  switch (priority) {
    case "high":
    case "P1":
      return { label: "P1", className: "bg-red-100 text-red-700" }
    case "medium":
    case "P2":
      return { label: "P2", className: "bg-amber-100 text-amber-700" }
    case "low":
    case "P3":
      return { label: "P3", className: "bg-slate-100 text-slate-600" }
    default:
      return { label: "P3", className: "bg-slate-100 text-slate-600" }
  }
}

function getDueDateStyle(dueDate: string | null): string {
  if (!dueDate) return "text-muted-foreground"
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return "text-red-600 font-medium"
  if (diffDays <= 3) return "text-amber-600 font-medium"
  return "text-muted-foreground"
}

function sortTasks(tasks: Task[]): Task[] {
  const now = new Date()
  return [...tasks].sort((a, b) => {
    // Overdue first
    const aOverdue = a.due_date ? new Date(a.due_date) < now : false
    const bOverdue = b.due_date ? new Date(b.due_date) < now : false
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1
    // Then by due date ascending
    if (a.due_date && b.due_date) {
      const diff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      if (diff !== 0) return diff
    }
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1
    // Then by priority
    const pOrder: Record<string, number> = { high: 0, P1: 0, medium: 1, P2: 1, low: 2, P3: 2 }
    return (pOrder[a.priority || "P3"] ?? 2) - (pOrder[b.priority || "P3"] ?? 2)
  })
}

export function ClientTasks({ tasks }: ClientTasksProps) {
  const sorted = sortTasks(tasks)

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Client Tasks
      </h2>

      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No tasks awaiting client action.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((task) => {
            const badge = getPriorityBadge(task.priority)
            const clientName = `${task.projects.clients.first_name} ${task.projects.clients.last_name}`

            return (
              <Link
                key={task.id}
                href={`/admin/project/${task.project_id}?tab=tasks`}
                className="group flex min-w-0 items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
              >
                {/* Priority badge */}
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-xs font-bold",
                    badge.className
                  )}
                >
                  {badge.label}
                </span>

                {/* Task info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-[var(--awyc-primary)]">
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {clientName} &middot; {task.projects.name}
                  </p>
                </div>

                {/* Due date */}
                {task.due_date && (
                  <span className={cn("shrink-0 text-xs", getDueDateStyle(task.due_date))}>
                    {formatDate(task.due_date)}
                  </span>
                )}

                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
