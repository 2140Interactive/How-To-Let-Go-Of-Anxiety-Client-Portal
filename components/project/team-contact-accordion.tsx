"use client"

import { useState } from "react"
import { Calendar, User, Mail, ChevronDown, MessageSquare } from "lucide-react"
import { PopupModal } from "react-calendly"
import { cn } from "@/lib/utils"
import { SendMessageDialog } from "@/components/dashboard/send-message-dialog"

interface TeamMember {
  id: string
  name: string
  role: string
  email: string
  phone: string | null
  photo_url: string | null
  scheduling_url: string | null
  is_primary: boolean
}

interface TeamContactAccordionProps {
  teamMembers: TeamMember[]
  projectName: string
}

const CALENDLY_URL = "#"

export function TeamContactAccordion({
  teamMembers,
  projectName,
}: TeamContactAccordionProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)
  const primary = teamMembers.find((m) => m.is_primary) || teamMembers[0]

  if (!primary) return null

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-12 w-full items-center justify-between px-4 text-left"
        >
          <span className="text-sm font-semibold text-foreground">
            Contact {primary.name.split(" ")[0]}
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
              {primary.photo_url ? (
                <img
                  src={primary.photo_url}
                  alt={primary.name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--awyc-primary)]/10">
                  <User className="h-4 w-4 text-[var(--awyc-primary)]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{primary.name}</p>
                <p className="text-xs text-muted-foreground">{primary.role}</p>
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

      <PopupModal
        url={CALENDLY_URL}
        onModalClose={() => setShowCalendly(false)}
        open={showCalendly}
        rootElement={typeof document !== "undefined" ? document.body : (undefined as unknown as HTMLElement)}
      />

      <SendMessageDialog
        open={showMessageDialog}
        onOpenChange={setShowMessageDialog}
        adminEmail={primary.email}
        adminName={primary.name}
      />
    </>
  )
}
