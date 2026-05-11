'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type RealtimeCallback = () => void

export function useDashboardRealtime(clientId: string, onUpdate: RealtimeCallback) {
  // Use ref to store callback to avoid re-subscribing when callback changes
  const callbackRef = useRef(onUpdate)
  callbackRef.current = onUpdate

  useEffect(() => {
    const handleUpdate = () => callbackRef.current()
    const supabase = createClient()
    const channels: RealtimeChannel[] = []

    // Subscribe to tasks changes (no project filter, RLS handles filtering)
    const tasksChannel = supabase
      .channel(`dashboard_${clientId}_tasks`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          handleUpdate()
        }
      )
      .subscribe()

    channels.push(tasksChannel)

    // Subscribe to payments changes (no project filter, RLS handles filtering)
    const paymentsChannel = supabase
      .channel(`dashboard_${clientId}_payments`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
        },
        () => {
          handleUpdate()
        }
      )
      .subscribe()

    channels.push(paymentsChannel)

    // Subscribe to notifications changes (filter by client_id)
    const notificationsChannel = supabase
      .channel(`dashboard_${clientId}_notifications`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          handleUpdate()
        }
      )
      .subscribe()

    channels.push(notificationsChannel)

    // Subscribe to messages changes (no project filter, RLS handles filtering)
    const messagesChannel = supabase
      .channel(`dashboard_${clientId}_messages`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          handleUpdate()
        }
      )
      .subscribe()

    channels.push(messagesChannel)

    // Cleanup: unsubscribe from all channels on unmount
    return () => {
      channels.forEach((channel) => {
        supabase.removeChannel(channel)
      })
    }
  }, [clientId])
}
