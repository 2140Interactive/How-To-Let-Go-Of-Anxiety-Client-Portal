"use client"

import { useState } from "react"
import { Calendar, User, Mail, ChevronDown, MessageSquare } from "lucide-react"
import { PopupModal } from "react-calendly"
import { cn } from "@/lib/utils"
import { SendMessageDialog } from "@/components/dashboard/send-message-dialog"

interface DashboardTeamCardProps {
  teamMember: {
    name: string
    role: string
    email: string
    phone: string | null
    photo_url: string | null
    scheduling_url: string | null
  }
  projects: Array<{ id: string; name: string }>
  defaultOpen?: boolean
}

const CALENDLY_URL = "#"

export function DashboardTeamCard({
  teamMember,
  projects,
  defaultOpen = false,
}: DashboardTeamCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)

  return (
    <>
      {/* Desktop: full vertical card */}
      <div className="hidden lg:block rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your How To Let Go Of Anxiety Team
        </h2>

        <div className="flex flex-col items-center gap-3 text-center">
          {teamMember.photo_url ? (
            <img
              src={teamMember.photo_url}
              alt={teamMember.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--awyc-primary)]/10">
              <User className="h-8 w-8 text-[var(--awyc-primary)]" />
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-foreground">{teamMember.name}</p>
            <p className="text-sm text-muted-foreground">{teamMember.role}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowCalendly(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Calendar className="h-4 w-4" />
            Schedule a Call (coming soon)
          </button>
          <button
            type="button"
            onClick={() => setShowMessageDialog(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <MessageSquare className="h-4 w-4" />
            Send Message
          </button>
        </div>
      </div>

      {/* Mobile: collapsible accordion */}
      <div className="lg:hidden rounded-xl border border-border bg-card shadow-sm">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-12 w-full items-center justify-between px-4 text-left"
        >
          <span className="text-sm font-semibold text-foreground">
            Contact {teamMember.name.split(" ")[0]}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            <div className="flex items-start gap-3">
              {teamMember.photo_url ? (
                <img
                  src={teamMember.photo_url}
                  alt={teamMember.name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--awyc-primary)]/10">
                  <User className="h-4 w-4 text-[var(--awyc-primary)]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{teamMember.name}</p>
                <p className="text-xs text-muted-foreground">{teamMember.role}</p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCalendly(true)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Calendar className="h-3.5 w-3.5" />
                Schedule a Call (coming soon)
              </button>
              <button
                type="button"
                onClick={() => setShowMessageDialog(true)}
                className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Mail className="h-3.5 w-3.5" />
                Send Message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Calendly Popup */}
      <PopupModal
        url={CALENDLY_URL}
        onModalClose={() => setShowCalendly(false)}
        open={showCalendly}
        rootElement={typeof document !== "undefined" ? document.body : (undefined as unknown as HTMLElement)}
      />

      {/* Send Message Dialog */}
      <SendMessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        adminEmail={teamMember.email}
        adminName={teamMember.name}
        projects={projects}
      />
    </>
  )
}
