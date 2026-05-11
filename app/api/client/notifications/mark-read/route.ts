import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { authId, notificationIds } = await request.json()

    if (!authId || !notificationIds || notificationIds.length === 0) {
      return NextResponse.json(
        { error: "Missing authId or notificationIds" },
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

    // Mark notifications as read
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("client_id", clientId)
      .in("id", notificationIds)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error marking notifications as read:", err)
    return NextResponse.json(
      { error: "Failed to mark notifications as read" },
      { status: 500 }
    )
  }
}
