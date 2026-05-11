import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Get total count of unread client messages
    const { count, error: countError } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_type", "client")
      .eq("is_read", false)

    if (countError) throw countError

    // Get recent unread client messages with proper joins through projects > clients
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select(
        "id, project_id, content, created_at, sender_id, projects(name, client_id, clients(first_name, last_name))"
      )
      .eq("sender_type", "client")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(5)

    if (messagesError) throw messagesError

    const unreadCount = count || 0

    // Format messages for display
    const recentMessages = (messages || []).map((msg: any) => ({
      id: msg.id,
      projectId: msg.project_id,
      clientName: `${msg.projects?.clients?.first_name || "Client"} ${msg.projects?.clients?.last_name || ""}`.trim(),
      projectName: msg.projects?.name || "Unknown Project",
      preview: msg.content.substring(0, 80) + (msg.content.length > 80 ? "..." : ""),
      createdAt: msg.created_at,
    }))

    return NextResponse.json({
      unreadCount,
      messages: recentMessages,
    })
  } catch (err) {
    console.error("Error fetching unread count:", err)
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    )
  }
}
