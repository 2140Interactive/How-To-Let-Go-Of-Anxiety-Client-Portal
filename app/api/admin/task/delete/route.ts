import { createClient } from "@/lib/supabase/server"
import { adminSideEffects, getAdminName } from "@/lib/admin-api-helpers"

export async function DELETE(request: Request) {
  // Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { taskId, projectId, taskTitle } = body

  if (!taskId || !projectId) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const adminName = await getAdminName(user.email || "")

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  await adminSideEffects({
    projectId,
    adminName,
    activity: {
      type: "task_created",
      title: `Task removed: ${taskTitle || "Unknown task"}`,
    },
    webhook: { event: "task_deleted", taskTitle },
  })

  return Response.json({ success: true })
}
