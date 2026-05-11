"use client"

import { useState } from "react"
import { Calendar, User, MessageSquare } from "lucide-react"
import { PopupModal } from "react-calendly"

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

interface TeamSidebarProps {
  teamMembers: TeamMember[]
  projectName: string
}

const CALENDLY_URL = "https://calendly.com/automatewhatyoucan/15-minute-call"

export function TeamSidebar({ teamMembers, projectName }: TeamSidebarProps) {
  const primary = teamMembers.find((m) => m.is_primary) || teamMembers[0]
  const [showCalendly, setShowCalendly] = useState(false)

  if (!primary) return null

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your AWYC Team
        </h2>

        <div className="flex flex-col items-center gap-3 text-center">
          {primary.photo_url ? (
            <img
              src={primary.photo_url}
              alt={primary.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--awyc-primary)]/10">
              <User className="h-8 w-8 text-[var(--awyc-primary)]" />
            </div>
          )}
          <div>
            <p className="text-lg font-semibold text-foreground">{primary.name}</p>
            <p className="text-sm text-muted-foreground">{primary.role}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowCalendly(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Calendar className="h-4 w-4" />
            Schedule 15-Min Call
          </button>
          <button
            type="button"
            onClick={() => {
              const messagesSection = document.getElementById("messages")
              if (messagesSection) {
                messagesSection.scrollIntoView({ behavior: "smooth" })
              }
            }}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <MessageSquare className="h-4 w-4" />
            Send Message
          </button>
        </div>
      </div>

      <PopupModal
        url={CALENDLY_URL}
        onModalClose={() => setShowCalendly(false)}
        open={showCalendly}
        rootElement={typeof document !== "undefined" ? document.body : (undefined as unknown as HTMLElement)}
      />
    </>
  )
}
