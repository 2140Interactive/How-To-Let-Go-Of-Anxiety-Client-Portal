"use client"

import { cn } from "@/lib/utils"
import { Check, AlertTriangle, RefreshCw } from "lucide-react"
import { useRef, useEffect, useState } from "react"

interface Milestone {
  id: string
  name: string
  short_label: string
  description: string | null
  order: number
  status: "completed" | "in_progress" | "upcoming" | "blocked" | "revision"
  expected_completion_date: string | null
  completed_at: string | null
}

interface MilestoneRoadmapProps {
  milestones: Milestone[]
  currentPhaseName?: string
  statusNote?: string | null
}

function formatMilestoneDate(dateString: string | null): string {
  if (!dateString) return ""
  const [year, month, day] = dateString.split("T")[0].split("-").map(Number)
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${monthNames[month - 1]} ${day}, ${year}`
}

function MilestoneCircle({ status }: { status: Milestone["status"] }) {
  switch (status) {
    case "completed":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--awyc-teal-success)]">
          <Check className="h-4 w-4 text-white" />
        </div>
      )
    case "in_progress":
      return (
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--awyc-primary)]">
          <div className="h-3 w-3 rounded-full bg-white" />
          <div className="absolute inset-0 animate-pulse rounded-full bg-[var(--awyc-primary)]/30 motion-reduce:animate-none" />
        </div>
      )
    case "upcoming":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#d4dde0] bg-white" />
      )
    case "blocked":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500">
          <AlertTriangle className="h-4 w-4 text-white" />
        </div>
      )
    case "revision":
      return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500">
          <RefreshCw className="h-4 w-4 text-white" />
        </div>
      )
  }
}

export function MilestoneRoadmap({ milestones, currentPhaseName, statusNote }: MilestoneRoadmapProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLDivElement>(null)
  const [, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      // Only auto-scroll if content actually overflows
      // Only scroll if content overflows by more than a trivial amount
      if (container.scrollWidth - container.clientWidth < 20) return
      const active = activeRef.current
      const containerRect = container.getBoundingClientRect()
      const activeRect = active.getBoundingClientRect()
      const scrollLeft =
        activeRect.left - containerRect.left - containerRect.width / 2 + activeRect.width / 2 + container.scrollLeft
      container.scrollTo({ left: scrollLeft, behavior: "smooth" })
    }
  }, [])

  const lastCompletedIndex = milestones.reduce(
    (acc, m, i) => (m.status === "completed" ? i : acc),
    -1
  )

  if (milestones.length === 0) {
    return (
      <div className="min-w-0 rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Milestone Roadmap
        </h2>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
            <div className="h-3 w-3 rounded-full bg-muted-foreground/20" />
          </div>
          <p className="text-sm font-medium text-foreground">Project Kickoff</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Your project roadmap is being prepared. Milestones will appear here as your project progresses.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div data-tour="milestone-roadmap" className="relative z-0 min-w-0 rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Milestone Roadmap
      </h2>
      <div
        ref={scrollRef}
        className="flex items-start gap-0 overflow-x-auto pl-4 pr-2 pb-4 scroll-smooth"
        style={{ scrollSnapType: "x proximity" }}
      >
        {milestones.map((milestone, index) => {
          const isActive = milestone.status === "in_progress"
          const isLast = index === milestones.length - 1
          const lineCompleted = index <= lastCompletedIndex

          return (
            <div
              key={milestone.id}
              ref={isActive ? activeRef : undefined}
              className="relative flex flex-col items-center"
              style={{ scrollSnapAlign: isActive ? "center" : undefined, minWidth: "90px", flex: "1 0 90px" }}
              title={[
                milestone.name,
                milestone.description,
                milestone.expected_completion_date ? `Expected: ${formatMilestoneDate(milestone.expected_completion_date)}` : null,
                milestone.completed_at ? `Completed: ${formatMilestoneDate(milestone.completed_at)}` : null,
              ].filter(Boolean).join("\n")}
            >
              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "absolute top-[18px] left-1/2 h-0.5 w-full",
                    lineCompleted
                      ? "bg-[var(--awyc-teal-success)]"
                      : "bg-[#d4dde0]"
                  )}
                  style={{ zIndex: 0 }}
                />
              )}

              {/* Circle */}
              <div className="relative z-10 cursor-pointer">
                <MilestoneCircle status={milestone.status} />
              </div>

              {/* Label */}
              <span
                className={cn(
                  "mt-2 max-w-[90px] text-center text-xs leading-tight select-none",
                  milestone.status === "completed" && "text-foreground",
                  milestone.status === "in_progress" && "font-bold text-foreground",
                  milestone.status === "upcoming" && "text-[#6b7a7d]",
                  milestone.status === "blocked" && "text-red-600",
                  milestone.status === "revision" && "text-amber-600"
                )}
              >
                {milestone.short_label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Current status section */}
      {currentPhaseName && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-bold text-foreground">
            Current Phase: {currentPhaseName}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {statusNote ||
              "Work is in progress on this phase. Check the activity feed below for recent updates."}
          </p>
        </div>
      )}
    </div>
  )
}
