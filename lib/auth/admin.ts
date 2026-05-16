/**
 * Returns true if the given email is configured as an admin.
 *
 * The ADMIN_EMAIL environment variable holds one or more admin emails as a
 * comma-separated list, e.g. "greg@2140interactive.com,lorraine@howtoletgoofanxiety.com".
 * Whitespace and case are normalized; empty entries are ignored. A single email
 * (no commas) remains valid for backward compatibility.
 *
 * This is the single source of truth for admin gating at the app layer. Other
 * modules (middleware, auth callback, route handlers) should call this rather
 * than reading process.env.ADMIN_EMAIL directly.
 *
 * Note: this does NOT govern database-level access. Supabase RLS policies are a
 * separate gate and must be updated independently to recognize each admin email
 * (or, better, refactored to use an admins table).
 */
export function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (admins.length === 0) return false
  return admins.includes(email.toLowerCase())
}
