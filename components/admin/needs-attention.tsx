import Link from "next/link"
import { AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils/format"
import { cn } from "@/lib/utils"

interface ItemProject {
  name: string
  id: string
  clients: { first_name: string; last_name: string } | null
}

interface NeedsAttentionItem {
  id: string
  title?: string
  amount?: number
  due_date: string
  project_id?: string
  projects: ItemProject | null
  itemType: "task" | "payment"
  urgency: "overdue" | "due_today" | "due_this_week"
  priority?: string | null
}

function getPriorityBadge(priority: string | null | undefined) {
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
      return null
  }
}

interface StalledProject {
  type: "stalled_phase"
  projectId: string
  projectName: string
  clientName: string
  lastCompletedName: string
  nextMilestoneName: string
  stalledSince: string
}

interface NeedsAttentionProps {
  items: NeedsAttentionItem[]
  stalledProjects?: StalledProject[]
}

function daysFromNow(dateStr: string): number {
  const due = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDueLabel(item: NeedsAttentionItem): string {
  if (item.urgency === "overdue") {
    const days = daysFromNow(item.due_date)
    return `overdue by ${days} day${days !== 1 ? "s" : ""}`
  }
  if (item.urgency === "due_today") return "due today"
  const due = new Date(item.due_date)
  return `due ${due.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
}

function clientLabel(projects: ItemProject | null): string {
  if (!projects) return ""
  const client = projects.clients
    ? `${projects.clients.first_name} ${projects.clients.last_name}`
    : ""
  return [client, projects.name].filter(Boolean).join(", ")
}

const urgencyConfig = {
  overdue: {
    heading: "Overdue",
    headingClass: "text-red-600",
    borderClass: "border-l-red-500",
    dotClass: "bg-red-500",
    dueClass: "text-red-600",
  },
  stalled: {
    heading: "Stalled",
    headingClass: "text-amber-600",
    borderClass: "border-l-amber-500",
    dotClass: "bg-amber-500",
  },
  due_today: {
    heading: "Due Today",
    headingClass: "text-amber-600",
    borderClass: "border-l-amber-500",
    dotClass: "bg-amber-500",
    dueClass: "text-amber-600",
  },
  due_this_week: {
    heading: "This Week",
    headingClass: "text-amber-500",
    borderClass: "border-l-amber-300",
    dotClass: "bg-amber-400",
    dueClass: "text-amber-500",
  },
}

export function NeedsAttention({ items, stalledProjects = [] }: NeedsAttentionProps) {
  const hasItems = items.length > 0 || stalledProjects.length > 0

  // Group by urgency preserving sort order
  const overdue = items.filter((i) => i.urgency === "overdue")
  const dueToday = items.filter((i) => i.urgency === "due_today")
  const dueThisWeek = items.filter((i) => i.urgency === "due_this_week")

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Needs Attention
      </h2>

      {!hasItems ? (
        <div className="flex flex-1 items-center justify-center gap-2 py-4 text-sm text-[var(--awyc-teal-success)]">
          <CheckCircle2 className="h-4 w-4" />
          All clear. Nothing needs attention this week.
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Overdue */}
          {overdue.length > 0 && (
            <UrgencyGroup groupKey="overdue" items={overdue} />
          )}

          {/* Stalled Phases - between Overdue and Due Today */}
          {stalledProjects.length > 0 && (
            <div>
              <p className={cn("mb-2 text-xs font-bold uppercase tracking-wider", urgencyConfig.stalled.headingClass)}>
                {urgencyConfig.stalled.heading}
              </p>
              <div className="flex flex-col gap-2">
                {stalledProjects.map((sp) => (
                  <Link
                    key={sp.projectId}
                    href={`/admin/project/${sp.projectId}?tab=milestones`}
                    className={cn(
                      "group flex items-start gap-3 rounded-lg border-l-3 py-2 pl-3 pr-2 transition-colors hover:bg-muted/50",
                      urgencyConfig.stalled.borderClass
                    )}
                  >
                    <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", urgencyConfig.stalled.dotClass)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {sp.projectName}: No active phase.{" "}
                        <span className="font-normal text-muted-foreground">
                          {sp.nextMilestoneName} is next but {"hasn't"} started.
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {sp.clientName && `${sp.clientName} \u00B7 `}
                        Last phase completed {daysFromNow(sp.stalledSince)} day{daysFromNow(sp.stalledSince) !== 1 ? "s" : ""} ago
                      </p>
                    </div>
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Due Today */}
          {dueToday.length > 0 && (
            <UrgencyGroup groupKey="due_today" items={dueToday} />
          )}

          {/* Due This Week */}
          {dueThisWeek.length > 0 && (
            <UrgencyGroup groupKey="due_this_week" items={dueThisWeek} />
          )}
        </div>
      )}
    </div>
  )
}

function UrgencyGroup({ groupKey, items }: { groupKey: "overdue" | "due_today" | "due_this_week"; items: NeedsAttentionItem[] }) {
  const config = urgencyConfig[groupKey]
  return (
    <div>
      <p className={cn("mb-2 text-xs font-bold uppercase tracking-wider", config.headingClass)}>
        {config.heading}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const projectId = item.projects?.id || item.project_id
          const tab = item.itemType === "task" ? "tasks" : "payments"
          const href = projectId ? `/admin/project/${projectId}?tab=${tab}` : "#"
          const context = clientLabel(item.projects)
          const label =
            item.itemType === "task"
              ? item.title || "Untitled task"
              : `Payment of ${formatCurrency(item.amount || 0)}`
          
          // Priority badge for tasks only
          const priorityBadge = item.itemType === "task" ? getPriorityBadge(item.priority) : null
          
          // P1 + overdue gets enhanced styling
          const isP1Overdue = groupKey === "overdue" && (item.priority === "P1" || item.priority === "high")

          return (
            <Link
              key={`${item.itemType}-${item.id}`}
              href={href}
              className={cn(
                "group flex items-start gap-3 rounded-lg border-l-3 py-2 pl-3 pr-2 transition-colors hover:bg-muted/50",
                isP1Overdue ? "border-l-red-600 border-l-4 bg-red-50/50" : config.borderClass
              )}
            >
              <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", config.dotClass)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                  {priorityBadge && (
                    <span className={cn("mr-1.5 inline-flex rounded px-1 py-0.5 text-xs font-bold", priorityBadge.className)}>
                      {priorityBadge.label}
                    </span>
                  )}
                  {label}{" "}
                  <span className={cn("font-normal", config.dueClass)}>
                    &mdash; {formatDueLabel(item)}
                  </span>
                </p>
                {context && (
                  <p className="text-xs text-muted-foreground">{context}</p>
                )}
              </div>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
