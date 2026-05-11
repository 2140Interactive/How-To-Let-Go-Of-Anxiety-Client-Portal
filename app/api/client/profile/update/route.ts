import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getClientByAuthId } from "@/lib/data/dashboard"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await getClientByAuthId(user.id)
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const { first_name, last_name } = await request.json()

    if (!first_name?.trim()) {
      return NextResponse.json(
        { error: "First name is required" },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()
    const { error: updateError } = await serviceClient
      .from("clients")
      .update({
        first_name: first_name.trim(),
        last_name: (last_name || "").trim(),
      })
      .eq("id", client.id)

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
