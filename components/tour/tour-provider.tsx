"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import type { DriveStep } from "driver.js"

interface TourContextValue {
  startTour: () => void
  isTourActive: boolean
}

const TourContext = createContext<TourContextValue | null>(null)

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error("useTour must be used within TourProvider")
  }
  return context
}

// Dashboard steps
const dashboardSteps: DriveStep[] = [
  {
    popover: {
      title: "Welcome!",
      description: "Welcome to your project portal! Let us take a quick look around.",
    },
  },
  {
    element: "[data-tour='project-card']",
    popover: {
      title: "Your Projects",
      description: "Your active projects appear here.<br><br>Click <b>View Details</b> on any project card to see milestones, deliverables, and more.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "[data-tour='action-items']",
    popover: {
      title: "Action Items",
      description: "Tasks that need your attention appear here. To explore your project in depth, click <b>View Details</b> on your project card.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: "[data-tour='recent-activity']",
    popover: {
      title: "Recent Activity",
      description: "Stay in the loop. Recent updates to your project appear here so you always know what is happening.",
      side: "top",
      align: "center",
    },
  },
  {
    popover: {
      title: "Keep Going!",
      description: "Click on the <b>View Details</b> link of your project now to view the last 3 tooltip steps of the tour.",
    },
  },
]

// Project detail steps
const projectDetailSteps: DriveStep[] = [
  {
    element: "[data-tour='milestone-roadmap']",
    popover: {
      title: "Project Milestones",
      description: "Track your project progress here. Each milestone shows what phase you are in and what is coming next.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#files",
    popover: {
      title: "Documents & Files",
      description: "All your project files and deliverables are stored here. Download completed work anytime.",
      side: "top",
      align: "center",
    },
  },
  {
    element: "#payments",
    popover: {
      title: "Payment Activity",
      description: "View your payment history and any upcoming invoices. Pay securely through the portal.",
      side: "top",
      align: "center",
    },
  },
]

interface TourProviderProps {
  children: ReactNode
  hasSeenTour: boolean
}

export function TourProvider({ children, hasSeenTour }: TourProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false)
  const driverRef = useRef<any>(null)
  const pathname = usePathname()

  const isDashboard = pathname === "/dashboard"
  const isProjectDetail = pathname.startsWith("/project/")

  const markTourComplete = useCallback(async () => {
    setIsTourActive(false)
    try {
      await fetch("/api/client/tour", { method: "POST" })
    } catch {
      // Silently fail
    }
  }, [])

  // Dashboard tour
  const startDashboardTour = useCallback(() => {
    import("driver.js").then(({ driver }) => {
      const steps = dashboardSteps.filter((step) => {
        if (!step.element) return true
        return !!document.querySelector(step.element as string)
      })

      const driverInstance = driver({
        animate: true,
        overlayColor: "black",
        allowClose: true,
        stagePadding: 10,
        stageRadius: 8,
        showButtons: ["next", "previous", "close"],
        nextBtnText: "Next",
        prevBtnText: "Back",
        doneBtnText: "Finish",
        onDestroyStarted: () => {
          driverInstance.destroy()
          markTourComplete()
        },
        steps,
      })

      driverRef.current = driverInstance
      setIsTourActive(true)
      driverInstance.drive()
    })
  }, [markTourComplete])

  // Project detail tour
  const startProjectTour = useCallback(() => {
    import("driver.js").then(({ driver }) => {
      let attempts = 0
      const maxAttempts = 30

      const tryStart = () => {
        attempts++
        const firstElement = document.querySelector("[data-tour='milestone-roadmap']")

        if (!firstElement && attempts < maxAttempts) {
          setTimeout(tryStart, 100)
          return
        }

        const steps = projectDetailSteps.filter((step) => {
          if (!step.element) return true
          return !!document.querySelector(step.element as string)
        })

        if (steps.length === 0) {
          markTourComplete()
          return
        }

        const driverInstance = driver({
          animate: true,
          overlayColor: "black",
          allowClose: true,
          stagePadding: 10,
          stageRadius: 8,
          showButtons: ["next", "previous", "close"],
          nextBtnText: "Next",
          prevBtnText: "Back",
          doneBtnText: "Finish",
          onDestroyStarted: () => {
            driverInstance.destroy()
            markTourComplete()
          },
          steps,
        })

        driverRef.current = driverInstance
        setIsTourActive(true)
        driverInstance.drive()
      }

      tryStart()
    })
  }, [markTourComplete])

  // Help button / manual start
  const startTour = useCallback(() => {
    if (isDashboard) {
      startDashboardTour()
    } else if (isProjectDetail) {
      startProjectTour()
    }
  }, [isDashboard, isProjectDetail, startDashboardTour, startProjectTour])

  // Auto-start dashboard tour for new users
  useEffect(() => {
    if (!hasSeenTour && isDashboard) {
      const timer = setTimeout(startDashboardTour, 500)
      return () => clearTimeout(timer)
    }
  }, [hasSeenTour, isDashboard, startDashboardTour])

  return (
    <TourContext.Provider value={{ startTour, isTourActive }}>
      {children}
    </TourContext.Provider>
  )
}
