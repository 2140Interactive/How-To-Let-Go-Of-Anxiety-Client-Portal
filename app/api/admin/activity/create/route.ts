import { createClient } from "@/lib/supabase/server"
import { getAdminName } from "@/lib/admin-api-helpers"

export async function POST(request: Request) {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { projectId, title, description, type } = body

  if (!projectId || !title) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const adminName = await getAdminName(user.email || "")

  const { data, error } = await supabase
    .from("activities")
    .insert({
      project_id: projectId,
      type: type || "message",
      title: `${adminName}: ${title}`,
      description: description || null,
      source: "admin",
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  // Notify client but don't duplicate the activity (already inserted above)
  const { data: project } = await supabase
    .from("projects")
    .select("client_id")
    .eq("id", projectId)
    .single()

  if (project) {
    await supabase.from("notifications").insert({
      client_id: project.client_id,
      type: type || "message",
      title,
      message: description || title,
    })
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "activity_posted", projectId, title }),
    }).catch(() => console.log("n8n webhook failed"))
  }

  const { revalidatePath } = await import("next/cache")
  revalidatePath(`/admin/project/${projectId}`)
  revalidatePath(`/project/${projectId}`)
  revalidatePath("/dashboard")
  revalidatePath("/admin")

  return Response.json({ success: true, data })
}
