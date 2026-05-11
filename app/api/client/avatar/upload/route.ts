import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getClientByAuthId } from "@/lib/data/dashboard"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await getClientByAuthId(user.id)
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a JPEG, PNG, WebP, or GIF." },
        { status: 400 }
      )
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB." },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const clientName = `${client.first_name} ${client.last_name || ""}`.trim()
    const filePath = `${clientName}/avatar.${fileExt}`

    // Upload to Supabase Storage (service role bypasses storage RLS)
    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await serviceClient.storage
      .from("clients")
      .upload(filePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload avatar" },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = serviceClient.storage
      .from("clients")
      .getPublicUrl(filePath)

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`
    console.log("[v0] Generated publicUrl:", publicUrl)

    // Update client record (service role bypasses table RLS)
    const { error: updateError, data: updateData } = await serviceClient
      .from("clients")
      .update({ photo_url: publicUrl })
      .eq("id", client.id)
      .select()

    console.log("[v0] Update error:", updateError)
    console.log("[v0] Update data:", updateData)

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
