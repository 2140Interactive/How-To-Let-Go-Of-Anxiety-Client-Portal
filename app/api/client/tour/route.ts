import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: client, error } = await supabase
    .from("clients")
    .select("has_seen_tour")
    .eq("auth_user_id", user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 })
  }

  return NextResponse.json({ hasSeenTour: client.has_seen_tour ?? false })
}

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("clients")
    .update({ has_seen_tour: true })
    .eq("auth_user_id", user.id)

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { error } = await supabase
    .from("clients")
    .update({ has_seen_tour: false })
    .eq("auth_user_id", user.id)

  if (error) {
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
