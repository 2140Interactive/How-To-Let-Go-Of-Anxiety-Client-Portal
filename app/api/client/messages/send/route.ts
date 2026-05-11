import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { Resend } from "resend"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(request: Request) {
  try {
    const { projectId, content, clientId } = await request.json()

    if (!projectId || !content?.trim() || !clientId) {
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
        sender_type: "client",
        sender_id: clientId,
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

    // Look up client name and project name server-side
    const [clientResult, projectResult] = await Promise.all([
      supabase.from("clients").select("first_name, last_name").eq("id", clientId).single(),
      supabase.from("projects").select("name").eq("id", projectId).single(),
    ])

    const clientName = clientResult.data
      ? `${clientResult.data.first_name} ${clientResult.data.last_name}`
      : "A client"
    const projectName = projectResult.data?.name || "their project"

    // Send email notification to admin
    await resend.emails.send({
      from: "Automate What You Can <hello@portal.automatewhatyoucan.com>",
      to: "automatewhatyoucan@gmail.com",
      subject: `New message from ${clientName} on ${projectName}`,
      html: `<p><strong>${clientName}</strong> sent a message on the <strong>${projectName}</strong> project:</p><blockquote style="margin: 16px 0; padding-left: 16px; border-left: 3px solid #ddd; color: #666;">${content.trim()}</blockquote><p><a href="${process.env.VERCEL_URL || 'https://portal.automatewhatyoucan.com'}/admin/project/${projectId}?tab=messages">View message</a></p>`,
    }).catch(err => console.error("Failed to send email notification:", err))

    return NextResponse.json({ success: true, message: data })
  } catch (err) {
    console.error("Error in send message:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
