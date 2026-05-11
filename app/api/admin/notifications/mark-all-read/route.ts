import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    // Mark all unread client messages as read
    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("sender_type", "client")
      .eq("is_read", false)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Error marking messages as read:", err)
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    )
  }
}
