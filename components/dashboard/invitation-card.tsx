"use client"

import { useState } from "react"
import { Plus, ArrowRight } from "lucide-react"
import { PopupModal } from "react-calendly"

interface InvitationCardProps {
  schedulingUrl?: string | null
}

// Calendly URL for scheduling automation discovery calls
const CALENDLY_URL = "https://calendly.com/automatewhatyoucan/15-minute-call"

export function InvitationCard({ schedulingUrl }: InvitationCardProps) {
  const [showCalendly, setShowCalendly] = useState(false)

  return (
    <>
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-[#F9FAFB] p-6 shadow-sm">
        <Plus className="mb-3 h-5 w-5 text-[#94A3B8]" />
        <h3 className="text-sm font-normal text-foreground text-center">
          Ready to reclaim more of your time?
        </h3>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Let's find your next automation opportunity.
        </p>
        <button
          type="button"
          onClick={() => setShowCalendly(true)}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#5095A3] transition-colors hover:text-[#5095A3]/80"
        >
          Show Me What's Possible
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendly Popup */}
      <PopupModal
        url={CALENDLY_URL}
        onModalClose={() => setShowCalendly(false)}
        open={showCalendly}
        rootElement={typeof document !== "undefined" ? document.body : (undefined as unknown as HTMLElement)}
      />
    </>
  )
}
