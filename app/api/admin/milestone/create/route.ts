import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { projectId, name, shortLabel, order } = body

  if (!projectId || !name || !shortLabel || order === undefined) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = await createClient()

  // Shift existing milestones at or after the insertion point
  const { data: existing } = await supabase
    .from("milestones")
    .select("id, order")
    .eq("project_id", projectId)
    .gte("order", order)
    .order("order", { ascending: false })

  if (existing && existing.length > 0) {
    for (const m of existing) {
      await supabase
        .from("milestones")
        .update({ order: m.order + 1 })
        .eq("id", m.id)
    }
  }

  const { data, error } = await supabase
    .from("milestones")
    .insert({
      project_id: projectId,
      name,
      short_label: shortLabel,
      order,
      status: "upcoming",
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, data })
}
