import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null
    const taskId = formData.get("taskId") as string | null
    const autoComplete = formData.get("autoComplete") === "true"

    if (!file || !projectId) {
      return Response.json({ error: "Missing file or projectId" }, { status: 400 })
    }

    // Validate file size (10MB for client uploads)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: "File exceeds 10MB limit" }, { status: 400 })
    }

    const adminSupabase = createAdminClient()
    const supabase = await createClient()

    // Get authenticated user's ID and look up client record
    const { data: { user } } = await supabase.auth.getUser()

    const { data: clientLookup } = await adminSupabase
      .from("clients")
      .select("id")
      .eq("auth_user_id", user?.id)
      .maybeSingle()

    if (!clientLookup) {
      return Response.json({ error: "Client record not found" }, { status: 403 })
    }

    // Look up client name and project name for storage path
    const { data: project } = await adminSupabase
      .from("projects")
      .select("name, client_id, clients(first_name, last_name)")
      .eq("id", projectId)
      .single()

    if (!project || !project.clients) {
      return Response.json({ error: "Project not found" }, { status: 404 })
    }

    const clientRecord = project.clients as unknown as { first_name: string; last_name: string | null }
    const clientName = `${clientRecord.first_name} ${clientRecord.last_name || ""}`.trim()
    const projectName = project.name

    // Build storage path: {clientName}/{projectName}/{timestamp}-{filename}
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `${clientName}/${projectName}/${timestamp}-${safeName}`

    // Upload to Supabase Storage using admin client (bypasses RLS)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await adminSupabase.storage
      .from("clients")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Client storage upload error:", uploadError.message)
      return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Insert file record
    const { data: fileRecord, error: dbError } = await adminSupabase
      .from("files")
      .insert({
        project_id: projectId,
        filename: file.name,
        storage_path: storagePath,
        file_type: file.type || null,
        file_size: file.size,
        task_id: taskId || null,
        uploaded_by: clientLookup.id,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file on DB failure
      await adminSupabase.storage.from("clients").remove([storagePath])
      console.error("[v0] Client file DB insert error:", dbError.message)
      return Response.json({ error: dbError.message }, { status: 500 })
    }

    // Auto-complete the task if requested
    if (autoComplete && taskId) {
      await adminSupabase
        .from("tasks")
        .update({ status: "completed" })
        .eq("id", taskId)
    }

    // Side effects (non-blocking, client-sourced)
    try {
      // Activity entry (source: client, no admin name prefix)
      await adminSupabase.from("activities").insert({
        project_id: projectId,
        type: "document_uploaded",
        title: `Client uploaded: ${file.name}`,
        description: taskId ? "File uploaded in response to a task." : null,
        source: "client",
      })

      // Notification for admin (in notifications table)
      await adminSupabase.from("notifications").insert({
        client_id: project.client_id,
        type: "document",
        title: `Client uploaded a file: ${file.name}`,
        message: `A file was uploaded to project "${projectName}".`,
      }).catch(() => {})

      // Fire n8n webhook
      const webhookUrl = process.env.N8N_WEBHOOK_URL
      if (webhookUrl) {
        fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "client_file_uploaded",
            projectId,
            taskId,
            filename: file.name,
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

    return Response.json({ success: true, data: fileRecord })
  } catch (err) {
    console.error("[v0] Client file upload unhandled error:", err)
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
