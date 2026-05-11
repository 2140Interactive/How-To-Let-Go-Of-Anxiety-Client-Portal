import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  const body = await request.json()
  const { milestoneId, projectId } = body

  if (!milestoneId || !projectId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = await createClient()

  // Get the milestone's order before deleting
  const { data: milestone } = await supabase
    .from("milestones")
    .select("order, name")
    .eq("id", milestoneId)
    .single()

  if (!milestone) {
    return Response.json({ error: "Milestone not found" }, { status: 404 })
  }

  // Delete the milestone
  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Reorder remaining milestones to close the gap
  const { data: remaining } = await supabase
    .from("milestones")
    .select("id, order")
    .eq("project_id", projectId)
    .gt("order", milestone.order)
    .order("order", { ascending: true })

  if (remaining && remaining.length > 0) {
    for (const m of remaining) {
      await supabase
        .from("milestones")
        .update({ order: m.order - 1 })
        .eq("id", m.id)
    }
  }

  return Response.json({ success: true })
}
