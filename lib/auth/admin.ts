export function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  if (!adminEmail) return false
  return email.toLowerCase() === adminEmail
}
