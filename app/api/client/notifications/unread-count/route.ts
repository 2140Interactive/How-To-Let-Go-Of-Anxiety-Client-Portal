import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const authId = searchParams.get("authId")

    if (!authId) {
      return NextResponse.json(
        { error: "Missing authId" },
        { status: 400 }
      )
    }

    // Get client ID from auth ID
    const { data: clientData, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("auth_user_id", authId)
      .single()

    if (clientError || !clientData) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      )
    }

    const clientId = clientData.id

    // Get total count of unread notifications
    const { count, error: countError } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("is_read", false)

    if (countError) throw countError

    // Get recent unread notifications with project names
    const { data: notifications, error: notificationsError } = await supabase
      .from("notifications")
      .select("id, title, type, project_id, created_at, projects(name)")
      .eq("client_id", clientId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5)

    if (notificationsError) throw notificationsError

    const unreadCount = count || 0

    // Format notifications for display
    const recentNotifications = (notifications || []).map((notif: any) => ({
      id: notif.id,
      title: notif.title,
      type: notif.type,
      projectName: notif.projects?.name || "Unknown Project",
      projectId: notif.project_id,
      createdAt: notif.created_at,
    }))

    return NextResponse.json({
      unreadCount,
      notifications: recentNotifications,
    })
  } catch (err) {
    console.error("Error fetching unread notifications:", err)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}
