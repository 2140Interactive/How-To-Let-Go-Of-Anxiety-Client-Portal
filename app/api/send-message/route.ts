import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"
import { getClientByAuthId } from "@/lib/data/dashboard"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = "hello@portal.automatewhatyoucan.com"

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await getClientByAuthId(user.id)

    if (!client) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { message, adminEmail, adminName } = await request.json()

    // Client identity comes from the session, not the request body
    const clientName = `${client.first_name} ${client.last_name || ""}`.trim()
    const clientEmail = client.email

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (!adminEmail) {
      return NextResponse.json(
        { error: "Missing admin email" },
        { status: 400 }
      )
    }

    // 1. Send notification to admin
    await resend.emails.send({
      from: `AWYC Portal <${FROM_EMAIL}>`,
      to: adminEmail,
      subject: `New message from ${clientName}`,
      text: [
        `New message from ${clientName} (${clientEmail})`,
        "",
        "---",
        "",
        message.trim(),
        "",
        "---",
        "",
        "This message was sent via the AWYC Client Portal.",
      ].join("\n"),
    })

    // 2. Send confirmation copy to client
    await resend.emails.send({
      from: `AWYC Portal <${FROM_EMAIL}>`,
      to: clientEmail,
      subject: "Your message to AWYC has been sent",
      text: [
        `Hi ${clientName.split(" ")[0]},`,
        "",
        "Your message has been sent to the AWYC team. Here is a copy for your records:",
        "",
        "---",
        "",
        message.trim(),
        "",
        "---",
        "",
        `Sent to: ${adminName} (${adminEmail})`,
        "",
        "We will get back to you shortly.",
        "",
        "- The AWYC Team",
      ].join("\n"),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    )
  }
}
