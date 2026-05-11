"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2, CheckCircle2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// Note: Select is still used for the client dropdown in Existing Client mode

interface Client {
  id: string
  first_name: string
  last_name: string
  company_name: string | null
}

interface NewClientProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adminName: string
}

export function NewClientProjectModal({
  open,
  onOpenChange,
  adminName,
}: NewClientProjectModalProps) {
  const router = useRouter()
  
  // Mode state
  const [mode, setMode] = useState<"new" | "existing">("new")
  
  // New client fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [companyName, setCompanyName] = useState("")
  
  // Existing client fields
  const [selectedClientId, setSelectedClientId] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  
  // Project fields
  const [projectName, setProjectName] = useState("")
  const [projectValue, setProjectValue] = useState("")
  
  // Form state
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch clients when switching to existing mode
  useEffect(() => {
    if (mode === "existing" && clients.length === 0) {
      fetchClients()
    }
  }, [mode])

  async function fetchClients() {
    setLoadingClients(true)
    try {
      const res = await fetch("/api/admin/client/create")
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err)
    } finally {
      setLoadingClients(false)
    }
  }

  function handleClose() {
    if (submitting) return
    onOpenChange(false)
    // Reset state after animation
    setTimeout(() => {
      setMode("new")
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setCompanyName("")
      setSelectedClientId("")
      setProjectName("")
      setProjectValue("")
      setSuccess(false)
      setError(null)
    }, 200)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        mode,
        // New client fields
        firstName: mode === "new" ? firstName : undefined,
        lastName: mode === "new" ? lastName : undefined,
        email: mode === "new" ? email : undefined,
        phone: mode === "new" ? phone : undefined,
        companyName: mode === "new" ? companyName : undefined,
        // Existing client fields
        clientId: mode === "existing" ? selectedClientId : undefined,
        // Project fields
        projectName,
        projectValue: projectValue ? parseFloat(projectValue) : undefined,
        adminName,
      }

      const res = await fetch("/api/admin/client/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create client/project")
      }

      setSuccess(true)
      router.refresh()

      // Auto-close after showing success
      setTimeout(() => {
        handleClose()
      }, 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const isFormValid = mode === "new"
    ? firstName && lastName && email && companyName && projectName && projectValue
    : selectedClientId && projectName && projectValue

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
      <div className="relative mx-4 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            New Client / Project
          </h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          /* Success state */
          <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--awyc-teal-success)]/10">
              <CheckCircle2 className="h-6 w-6 text-[var(--awyc-teal-success)]" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {mode === "new" ? "Client and project created!" : "Project created!"}
            </p>
            <p className="text-xs text-muted-foreground">
              The dashboard will refresh automatically.
            </p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("new")}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  mode === "new"
                    ? "bg-[var(--awyc-primary)] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                New Client
              </button>
              <button
                type="button"
                onClick={() => setMode("existing")}
                className={cn(
                  "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  mode === "existing"
                    ? "bg-[var(--awyc-primary)] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Existing Client
              </button>
            </div>

            {/* New Client Fields */}
            {mode === "new" && (
              <div className="flex flex-col gap-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Client Information
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="firstName" className="text-sm font-medium text-foreground">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={submitting}
                      className={cn(
                        "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                        "focus:border-[var(--awyc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--awyc-primary)]",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                      placeholder="John"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="lastName" className="text-sm font-medium text-foreground">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={submitting}
                      className={cn(
                        "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                        "focus:border-[var(--awyc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--awyc-primary)]",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className={cn(
                      "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                      "focus:border-[var(--awyc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--awyc-primary)]",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitting}
                    className={cn(
                      "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                      "focus:border-[var(--awyc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--awyc-primary)]",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="companyName" className="text-sm font-medium text-foreground">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={submitting}
                    className={cn(
                      "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                      "focus:border-[var(--awyc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--awyc-primary)]",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
            )}

            {/* Existing Client Selector */}
            {mode === "existing" && (
              <div className="flex flex-col gap-4">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Select Client
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="clientSelect" className="text-sm font-medium text-foreground">
                    Client <span className="text-red-500">*</span>
                  </label>
                  {loadingClients ? (
                    <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading clients...
                    </div>
                  ) : (
                    <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={submitting}>
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select a client..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.first_name} {client.last_name}
                            {client.company_name && ` (${client.company_name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}

            {/* Project Fields */}
            <div className="flex flex-col gap-4">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Project Information
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="projectName" className="text-sm font-medium text-foreground">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={submitting}
                  className={cn(
                    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                    "focus:border-[var(--awyc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--awyc-primary)]",
                    "disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                  placeholder="Onboarding Automation"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="projectValue" className="text-sm font-medium text-foreground">
                  Project Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <input
                    id="projectValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={projectValue}
                    onChange={(e) => setProjectValue(e.target.value)}
                    disabled={submitting}
                    className={cn(
                      "w-full rounded-lg border border-border bg-background pl-7 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                      "focus:border-[var(--awyc-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--awyc-primary)]",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    placeholder="5000.00"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                "bg-[var(--awyc-primary)] text-white hover:bg-[var(--awyc-primary-dark)]",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {mode === "new" ? "Create Client & Project" : "Create Project"}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// Button component to trigger the modal
export function NewClientProjectButton({ adminName }: { adminName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          "bg-[var(--awyc-primary)] text-white hover:bg-[var(--awyc-primary-dark)]"
        )}
      >
        <Plus className="h-4 w-4" />
        New Client / Project
      </button>
      <NewClientProjectModal
        open={open}
        onOpenChange={setOpen}
        adminName={adminName}
      />
    </>
  )
}
