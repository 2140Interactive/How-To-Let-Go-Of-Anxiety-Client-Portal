"use client"

import { HelpCircle } from "lucide-react"
import { useTour } from "./tour-provider"

export function HelpButton() {
  const { startTour, isTourActive } = useTour()

  if (isTourActive) {
    return null
  }

  const handleClick = async () => {
    // Reset has_seen_tour in database so it records correctly when tour completes
    try {
      await fetch("/api/client/tour", { method: "DELETE" })
    } catch {
      // Silently fail
    }
    startTour()
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-[9999] flex h-9 w-9 items-center justify-center rounded-full bg-[#5095A3] text-white shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#5095A3] focus:ring-offset-2"
      aria-label="Start guided tour"
      title="Take a tour"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  )
}
