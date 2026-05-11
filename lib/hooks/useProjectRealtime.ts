'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type RealtimeCallback = () => void

export function useProjectRealtime(projectId: string, onUpdate: RealtimeCallback) {
  // Use ref to store callback to avoid re-subscribing when callback changes
  const callbackRef = useRef(onUpdate)
  callbackRef.current = onUpdate

  useEffect(() => {
    const handleUpdate = () => callbackRef.current()
    const supabase = createClient()
    const channels: RealtimeChannel[] = []

    // Subscribe to tasks changes
    const tasksChannel = supabase
      .channel(`project_${projectId}_tasks`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] tasks change received:', payload)
          handleUpdate()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] tasks subscription status:', status)
      })

    channels.push(tasksChannel)

    // Subscribe to milestones changes
    const milestonesChannel = supabase
      .channel(`project_${projectId}_milestones`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milestones',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] milestones change received:', payload)
          handleUpdate()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] milestones subscription status:', status)
      })

    channels.push(milestonesChannel)

    // Subscribe to activity changes
    const activityChannel = supabase
      .channel(`project_${projectId}_activity`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] activities change received:', payload)
          handleUpdate()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] activities subscription status:', status)
      })

    channels.push(activityChannel)

    // Subscribe to files changes
    const filesChannel = supabase
      .channel(`project_${projectId}_files`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] files change received:', payload)
          handleUpdate()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] files subscription status:', status)
      })

    channels.push(filesChannel)

    // Subscribe to payments changes
    const paymentsChannel = supabase
      .channel(`project_${projectId}_payments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] payments change received:', payload)
          handleUpdate()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] payments subscription status:', status)
      })

    channels.push(paymentsChannel)

    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel(`project_${projectId}_messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('[Realtime] messages change received:', payload)
          handleUpdate()
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] messages subscription status:', status)
      })

    channels.push(messagesChannel)

    // Cleanup: unsubscribe from all channels on unmount
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [projectId])
}
