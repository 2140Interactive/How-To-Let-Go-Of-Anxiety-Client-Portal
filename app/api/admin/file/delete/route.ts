import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { fileId, projectId } = body

    if (!fileId) {
      return Response.json({ error: "Missing fileId" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get file record to find storage path
    const { data: file, error: fetchError } = await supabase
      .from("files")
      .select("storage_path, filename")
      .eq("id", fileId)
      .single()

    if (fetchError || !file) {
      return Response.json({ error: "File not found" }, { status: 404 })
    }

    // Delete from storage if path exists
    if (file.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("clients")
        .remove([file.storage_path])

      if (storageError) {
        console.error("[v0] Storage delete error:", storageError.message)
        // Continue to delete DB record even if storage fails
      }
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from("files")
      .delete()
      .eq("id", fileId)

    if (dbError) {
      return Response.json({ error: dbError.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
