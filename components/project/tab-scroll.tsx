"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export function TabScroll() {
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab")

  useEffect(() => {
    if (tab) {
      const el = document.getElementById(tab)
      if (el) {
        // Small delay to ensure layout is complete
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 100)
      }
    }
  }, [tab])

  return null
}
