import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { AvatarUpload } from "@/components/admin/avatar-upload"
import { ProfileEditor } from "@/components/admin/profile-editor"

export const metadata: Metadata = {
  title: "Account Settings | HTLGOA Admin",
  description: "Admin account settings",
}

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  // Fetch the primary team member record
  const { data: teamMember } = await supabase
    .from("team_members")
    .select("id, name, email, photo_url")
    .eq("is_primary", true)
    .single()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Account Settings
      </h1>

      <div className="max-w-xl rounded-xl border border-border bg-card px-6 py-8 shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Avatar upload */}
          {teamMember && (
            <AvatarUpload
              teamMemberId={teamMember.id}
              currentPhotoUrl={teamMember.photo_url}
              name={teamMember.name}
            />
          )}

          {/* Editable name & email */}
          {teamMember && (
            <ProfileEditor
              teamMemberId={teamMember.id}
              initialName={teamMember.name}
              initialEmail={teamMember.email}
            />
          )}


        </div>
      </div>
    </div>
  )
}
