import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { adminSideEffects, getAdminName } from "@/lib/admin-api-helpers"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = "hello@portal.howtoletgoofanxiety.com"

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const projectId = formData.get("projectId") as string | null
    const displayName = formData.get("displayName") as string | null
    const taskId = formData.get("taskId") as string | null
    const note = formData.get("note") as string | null

    if (!file || !projectId) {
      return Response.json({ error: "Missing file or projectId" }, { status: 400 })
    }

    // Validate file size (50MB)
    if (file.size > 52428800) {
      return Response.json({ error: "File exceeds 50MB limit" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const adminName = await getAdminName(user.email || "")

    // Look up client name, email, and project name for storage path
    const { data: project } = await supabase
      .from("projects")
      .select("name, client_id, welcome_email_sent_at, clients(first_name, last_name, email)")
      .eq("id", projectId)
      .single()

    if (!project || !project.clients) {
      return Response.json({ error: "Project not found" }, { status: 404 })
    }

    const clientRecord = project.clients as unknown as { first_name: string; last_name: string | null; email: string }
    const clientName = `${clientRecord.first_name} ${clientRecord.last_name || ""}`.trim()
    const clientEmail = clientRecord.email
    const clientFirstName = clientRecord.first_name
    const projectName = project.name

    // Build storage path: {clientName}/{projectName}/{timestamp}-{filename}
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const storagePath = `${clientName}/${projectName}/${timestamp}-${safeName}`

    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from("clients")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("[v0] Storage upload error:", uploadError.message, uploadError)
      return Response.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Insert file record into database
    const { data, error: dbError } = await supabase
      .from("files")
      .insert({
        project_id: projectId,
        filename: displayName || file.name,
        storage_path: storagePath,
        file_type: file.type || null,
        file_size: file.size,
        task_id: taskId || null,
        note: note || null,
        uploaded_by: null,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up the uploaded file if DB insert fails
      await supabase.storage.from("clients").remove([storagePath])
      console.error("[v0] DB insert error:", dbError.message)
      return Response.json({ error: dbError.message }, { status: 500 })
    }

    // Side effects (non-blocking)
    try {
      await adminSideEffects({
        projectId,
        adminName,
        activity: {
          type: "document_uploaded",
          title: `New deliverable: ${displayName || file.name}`,
          description: "A new document has been shared with you.",
        },
        notification: {
          type: "document",
          title: `A new document has been shared: ${displayName || file.name}`,
          message: `A new deliverable "${displayName || file.name}" is now available in your project.`,
        },
        webhook: { event: "file_uploaded", filename: displayName || file.name },
      })
    } catch {
      // Non-blocking
    }

    // Send email notification to client (only if welcome email has been sent)
    if (clientEmail && project.welcome_email_sent_at) {
      try {
        await resend.emails.send({
          from: `How To Let Go Of Anxiety <${FROM_EMAIL}>`,
          to: clientEmail,
          subject: `New Deliverable: ${displayName || file.name}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="border-top: 4px solid #5095A3; padding-top: 28px;">
    <p style="font-size: 20px; color: #5095A3; font-weight: bold; margin: 0 0 24px;">New Deliverable Available</p>
    <p style="margin: 0 0 16px;">Hi ${clientFirstName},</p>
    <p style="margin: 0 0 16px;">A new deliverable has been uploaded to your <strong>${projectName}</strong> project.</p>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0;"><strong>File:</strong> ${displayName || file.name}</p>
    </div>
    <p style="margin: 0 0 28px;">
      <a href="${process.env.NEXT_PUBLIC_PORTAL_URL}/project/${projectId}#files" style="background-color: #5095A3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px; display: inline-block;">View Deliverable</a>
    </p>
    <p style="margin: 0 0 8px;">Thank you.</p>
    <p style="margin: 0; color: #5095A3; font-weight: bold;">Andreas</p>
    <p style="margin: 4px 0 0; color: #888888; font-size: 14px;">How To Let Go Of Anxiety</p>
  </div>
</body>
</html>
          `,
        })
      } catch (emailError) {
        console.error("Failed to send deliverable notification email:", emailError)
      }
    }

    return Response.json({ success: true, data })
  } catch (err) {
    console.error("[v0] File upload unhandled error:", err)
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error", stack: err instanceof Error ? err.stack : undefined },
      { status: 500 }
    )
  }
}
