'use client'

import { useRouter } from 'next/navigation'
import { useDashboardRealtime } from '@/lib/hooks/useDashboardRealtime'

interface DashboardContentWrapperProps {
  clientId: string
  children: React.ReactNode
}

export function DashboardContentWrapper({
  clientId,
  children,
}: DashboardContentWrapperProps) {
  const router = useRouter()

  // When any dashboard-relevant data changes via Realtime, refresh the page
  const handleUpdate = () => {
    // Use a small delay to prevent excessive refreshes if multiple changes come in rapid succession
    setTimeout(() => {
      router.refresh()
    }, 500)
  }

  // Set up Realtime subscriptions for dashboard data tables
  useDashboardRealtime(clientId, handleUpdate)

  return <>{children}</>
}
