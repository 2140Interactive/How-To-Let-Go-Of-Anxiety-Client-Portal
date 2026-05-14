import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getClientByAuthId } from "@/lib/data/dashboard"
import { ClientAvatarUpload } from "@/components/client/avatar-upload"
import { ClientProfileEditor } from "@/components/client/profile-editor"

export const metadata: Metadata = {
  title: "Your Profile | HTLGOA",
  description: "Your profile information",
}

export default async function ClientSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const client = await getClientByAuthId(user.id)

  if (!client) redirect("/login")

  const initials = `${client.first_name[0]}${(client.last_name || "")[0] || ""}`.toUpperCase()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Your Profile
      </h1>

      <div className="max-w-xl rounded-xl border border-border bg-card px-6 py-8 shadow-sm">
        <div className="flex flex-col gap-6">
          {/* Avatar */}
          <ClientAvatarUpload
            currentUrl={client.photo_url || null}
            initials={initials}
          />

          {/* Name (editable) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Name
            </label>
            <ClientProfileEditor
              firstName={client.first_name}
              lastName={client.last_name || ""}
            />
          </div>

          {/* Email (read-only) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Email
            </label>
            <p className="text-sm font-medium text-foreground">
              {client.email}
            </p>
          </div>

          {/* Company (read-only) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Company
            </label>
            <p className="text-sm font-medium text-foreground">
              {client.company_name || "\u2014"}
            </p>
          </div>

          <div className="mt-2 rounded-lg bg-muted/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Contact your How To Let Go Of Anxiety team to update your email or company information.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
