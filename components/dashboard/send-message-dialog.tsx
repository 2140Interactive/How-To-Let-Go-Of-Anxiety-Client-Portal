"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { X, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface SendMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adminEmail: string
  adminName: string
  projects: Array<{ id: string; name: string }>
}

export function SendMessageDialog({
  open,
  onOpenChange,
  projects,
}: SendMessageDialogProps) {
  const router = useRouter()
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [navigating, setNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (navigating) return
    onOpenChange(false)
    setTimeout(() => {
      setSelectedProjectId("")
      setError(null)
    }, 200)
  }

  function handleNavigate() {
    if (!selectedProjectId || navigating) return

    setNavigating(true)
    setError(null)

    // Navigate to the project's messages section
    router.push(`/project/${selectedProjectId}#messages`)
    
    // Close dialog after navigation
    setTimeout(() => {
      handleClose()
      setNavigating(false)
    }, 500)
  }

  // Auto-navigate when dialog opens and client has exactly one project
  useEffect(() => {
    if (open && projects.length === 1) {
      router.push(`/project/${projects[0].id}#messages`)
      onOpenChange(false)
    }
  }, [open, projects])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Send Message
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={navigating}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 flex flex-col gap-4">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <AlertCircle className="h-8 w-8 text-amber-600" />
              <p className="text-sm text-muted-foreground">
                You don't have any active projects. Once you're assigned a project, you'll be able to message your team.
              </p>
            </div>
          ) : projects.length === 1 ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                You'll be taken to the messages section for:
              </p>
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-sm font-medium text-foreground">
                  {projects[0].name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProjectId(projects[0].id)
                  handleNavigate()
                }}
                disabled={navigating}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  "bg-[var(--awyc-primary)] text-white hover:bg-[var(--awyc-primary-dark)]",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {navigating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opening...
                  </>
                ) : (
                  "Open Messages"
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Select a project to send a message:
              </p>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id)
                      handleNavigate()
                    }}
                    disabled={navigating}
                    className={cn(
                      "rounded-lg border-2 p-3 text-left text-sm font-medium transition-all",
                      selectedProjectId === project.id
                        ? "border-[var(--awyc-primary)] bg-[var(--awyc-primary)]/5 text-foreground"
                        : "border-border bg-muted/50 text-foreground hover:border-[var(--awyc-primary)]/50",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                  >
                    {project.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
