'use client'

import { useRouter } from 'next/navigation'
import { useProjectRealtime } from '@/lib/hooks/useProjectRealtime'

interface ProjectContentWrapperProps {
  projectId: string
  children: React.ReactNode
}

export function ProjectContentWrapper({
  projectId,
  children,
}: ProjectContentWrapperProps) {
  const router = useRouter()

  // When any project data changes via Realtime, refresh the page
  const handleUpdate = () => {
    // Use a small debounce to prevent excessive refreshes if multiple changes come in rapid succession
    setTimeout(() => {
      router.refresh()
    }, 500)
  }

  // Set up Realtime subscriptions for all project data tables
  useProjectRealtime(projectId, handleUpdate)

  return <>{children}</>
}
