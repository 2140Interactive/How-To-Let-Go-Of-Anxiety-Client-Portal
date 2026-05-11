import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return Response.json({ error: "Missing fileId" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Look up the file record
    const { data: file, error } = await supabase
      .from("files")
      .select("storage_path, filename")
      .eq("id", fileId)
      .single()

    if (error || !file?.storage_path) {
      return Response.json({ error: "File not found" }, { status: 404 })
    }

    // Generate a signed URL (5 minutes expiry)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from("clients")
      .createSignedUrl(file.storage_path, 300)

    if (signError || !signedUrl?.signedUrl) {
      return Response.json({ error: "Failed to generate download URL" }, { status: 500 })
    }

    return Response.json({ url: signedUrl.signedUrl })
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
