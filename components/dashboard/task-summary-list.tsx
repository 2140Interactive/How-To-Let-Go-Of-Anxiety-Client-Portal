"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Eye } from "lucide-react"

interface Task {
  id: string
  title: string
  priority: string
  due_date: string | null
  status: string
  projects: { name: string } | null
  action_url?: string | null
  action_label?: string | null
}

interface TaskSummaryListProps {
  tasks: Task[]
  totalCount?: number
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "P1":
      return {
        label: "P1",
        className: "bg-red-100 text-red-700",
      }
    case "P2":
      return {
        label: "P2",
        className: "bg-amber-100 text-amber-700",
      }
    case "P3":
      return {
        label: "P3",
        className: "bg-muted text-muted-foreground",
      }
    default:
      return {
        label: priority,
        className: "bg-muted text-muted-foreground",
      }
  }
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) return ""
  const due = new Date(dueDate)
  return due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function TaskSummaryList({ tasks, totalCount }: TaskSummaryListProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {"You're all caught up! We're working on your projects and will let you know when we need something from you."}
        </p>
      </div>
    )
  }

  const showViewAll = totalCount && totalCount > 5

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <ul className="divide-y divide-border" role="list">
        {tasks.map((task) => {
          const badge = getPriorityBadge(task.priority)
          const isP1 = task.priority === "P1"

          return (
            <li
              key={task.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 md:px-6",
                isP1 && "bg-red-50/50"
              )}
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

              {/* Task title */}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {task.title}
              </span>

              {/* Project name */}
              {task.projects?.name && (
                <span className="hidden shrink-0 truncate text-xs text-muted-foreground md:block max-w-[150px]">
                  {task.projects.name}
                </span>
              )}

              {/* Due date */}
              {task.due_date && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDueDate(task.due_date)}
                </span>
              )}

              {/* Action button */}
              {task.action_url && (
                task.action_url.startsWith("/") ? (
                  <Link
                    href={task.action_url}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Eye className="h-3 w-3" />
                    {task.action_label || "Review"}
                  </Link>
                ) : (
                  <a
                    href={task.action_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Eye className="h-3 w-3" />
                    {task.action_label || "Review"}
                  </a>
                )
              )}
            </li>
          )
        })}
      </ul>

      {showViewAll && (
        <div className="border-t border-border px-4 py-3 md:px-6">
          <button
            type="button"
            className="text-sm font-medium text-[var(--awyc-primary)] hover:text-[var(--awyc-primary-dark)] transition-colors"
          >
            View All Tasks
          </button>
        </div>
      )}
    </div>
  )
}
