import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const teamMemberId = formData.get("teamMemberId") as string | null

    if (!file || !teamMemberId) {
      return Response.json(
        { error: "Missing file or teamMemberId" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return Response.json(
        { error: "Invalid file type. Only JPG, PNG, and WebP are accepted." },
        { status: 400 }
      )
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        { error: "File exceeds 5MB limit" },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Build storage path: team-avatars/{teamMemberId}-{timestamp}.{ext}
    const ext = file.name.split(".").pop() || "jpg"
    const timestamp = Date.now()
    const storagePath = `team-avatars/${teamMemberId}-${timestamp}.${ext}`

    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from("project-files")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("[avatar] Storage upload error:", uploadError.message)
      return Response.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("project-files")
      .getPublicUrl(storagePath)

    const publicUrl = urlData.publicUrl

    // Delete old avatar if one exists
    const { data: existing } = await supabase
      .from("team_members")
      .select("photo_url")
      .eq("id", teamMemberId)
      .single()

    if (existing?.photo_url) {
      // Extract the storage path from the old URL
      const oldPath = existing.photo_url.split("/project-files/")[1]
      if (oldPath && oldPath.startsWith("team-avatars/")) {
        await supabase.storage.from("project-files").remove([oldPath])
      }
    }

    // Update team_members record with the new photo_url
    const { error: updateError } = await supabase
      .from("team_members")
      .update({ photo_url: publicUrl })
      .eq("id", teamMemberId)

    if (updateError) {
      // Clean up uploaded file if DB update fails
      await supabase.storage.from("project-files").remove([storagePath])
      console.error("[avatar] DB update error:", updateError.message)
      return Response.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return Response.json({ success: true, photo_url: publicUrl })
  } catch (err) {
    console.error("[avatar] Unhandled error:", err)
    return Response.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
