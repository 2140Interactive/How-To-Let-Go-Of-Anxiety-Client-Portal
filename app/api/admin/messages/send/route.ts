import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { projectId, content, adminId } = await request.json()

    if (!projectId || !content?.trim() || !adminId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Insert message into database
    const { data, error } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        sender_type: "admin",
        sender_id: adminId,
        content: content.trim(),
        is_read: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error inserting message:", error)
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 }
      )
    }

    // Get client_id from the project and create notification
    const { data: project } = await supabase
      .from("projects")
      .select("client_id, name")
      .eq("id", projectId)
      .single()

    if (project) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          client_id: project.client_id,
          project_id: projectId,
          title: "New message: " + content.trim().substring(0, 80),
          type: "message",
          is_read: false,
        })

      if (notifError) {
        console.error("Failed to create notification:", notifError)
      }
    }

    return NextResponse.json({ success: true, message: data })
  } catch (err) {
    console.error("Error in send message:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
