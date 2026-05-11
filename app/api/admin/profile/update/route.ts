import { createAdminClient } from "@/lib/supabase/admin"

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { teamMemberId, name, email } = body

    if (!teamMemberId) {
      return Response.json(
        { error: "Missing teamMemberId" },
        { status: 400 }
      )
    }

    if (!name?.trim()) {
      return Response.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    if (!email?.trim()) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { error: updateError } = await supabase
      .from("team_members")
      .update({
        name: name.trim(),
        email: email.trim(),
      })
      .eq("id", teamMemberId)

    if (updateError) {
      console.error("[profile] DB update error:", updateError.message)
      return Response.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error("[profile] Unhandled error:", err)
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
