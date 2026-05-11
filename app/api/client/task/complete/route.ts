import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { taskId, projectId } = body

    if (!taskId || !projectId) {
      return Response.json({ error: "Missing taskId or projectId" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get current task to verify it exists and get title
    const { data: task, error: fetchError } = await supabase
      .from("tasks")
      .select("id, title, task_type, status")
      .eq("id", taskId)
      .single()

    if (fetchError || !task) {
      return Response.json({ error: "Task not found" }, { status: 404 })
    }

    if (task.status === "completed") {
      return Response.json({ error: "Task already completed" }, { status: 400 })
    }

    // Mark task as completed
    const { data, error } = await supabase
      .from("tasks")
      .update({ status: "completed" })
      .eq("id", taskId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Client task complete error:", error.message)
      return Response.json({ error: error.message }, { status: 500 })
    }

    // Side effects (non-blocking, client-sourced)
    try {
      const actionLabel = task.task_type === "approve" ? "approved" : "completed"

      await supabase.from("activities").insert({
        project_id: projectId,
        type: "task_completed",
        title: `Client ${actionLabel}: ${task.title}`,
        description: null,
        source: "client",
      })

      // Notification
      const { data: project } = await supabase
        .from("projects")
        .select("client_id, name")
        .eq("id", projectId)
        .single()

      if (project) {
        await supabase.from("notifications").insert({
          client_id: project.client_id,
          type: "task",
          title: `Task ${actionLabel}: ${task.title}`,
          message: `A task in project "${project.name}" has been ${actionLabel} by the client.`,
        }).catch(() => {})
      }

      // Fire n8n webhook
      const webhookUrl = process.env.N8N_WEBHOOK_URL
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "client_task_completed",
            projectId,
            taskId,
            taskTitle: task.title,
            taskType: task.task_type,
          }),
        }).catch(() => {})
      }
    } catch {
      // Non-blocking
    }

    // Revalidate
    revalidatePath(`/project/${projectId}`)
    revalidatePath(`/admin/project/${projectId}`)
    revalidatePath("/dashboard")
    revalidatePath("/admin")

    return Response.json({ success: true, data })
  } catch (err) {
    console.error("[v0] Client task complete unhandled error:", err)
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
