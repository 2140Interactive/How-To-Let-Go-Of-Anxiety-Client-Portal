"use client"

import { useState } from "react"
import { ChevronDown, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"

interface ProjectDetailsCollapsibleProps {
  project: {
    id: string
    name: string
    start_date: string | null
    estimated_end_date: string | null
    project_type: string
  }
}

export function ProjectDetailsCollapsible({ project }: ProjectDetailsCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const truncatedId = `${project.id.slice(0, 8)}...${project.id.slice(-4)}`

  function handleCopyId() {
    navigator.clipboard.writeText(project.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Project Reference
        </h2>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="border-t border-border px-6 pb-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Project Name</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{project.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Project ID</p>
              <button
                type="button"
                onClick={handleCopyId}
                className="mt-0.5 flex items-center gap-1.5 text-sm font-mono text-foreground hover:text-[var(--awyc-primary)]"
              >
                {truncatedId}
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[var(--awyc-teal-success)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Start Date</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {project.start_date ? formatDate(project.start_date) : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Est. Completion</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {project.estimated_end_date ? formatDate(project.estimated_end_date) : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Project Type</p>
              <p className="mt-0.5 text-sm font-medium capitalize text-foreground">
                {project.project_type}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
