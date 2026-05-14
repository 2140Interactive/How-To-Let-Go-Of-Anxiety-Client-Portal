import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Handle auth errors from Supabase
  if (error) {
    const message = errorDescription || error
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(message)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Invalid sign-in link. Please request a new one.")}`
    )
  }

  // Build a Supabase client that writes session cookies onto a redirect response.
  // We need to collect the cookies during exchangeCodeForSession and then
  // apply them to whichever redirect response we return.
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies)
        },
      },
    }
  )

  // Exchange the code for a session (this populates cookiesToSet)
  const { data: { user }, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !user) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Sign-in failed. Please try again.")}`
    )
  }

  // Helper: create a redirect that carries session cookies
  function redirectWithCookies(url: string) {
    const response = NextResponse.redirect(url)

    // Clear any stale sb- cookies before setting fresh session cookies
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) {
        response.cookies.delete(cookie.name)
      }
    }

    // Set fresh session cookies from exchangeCodeForSession
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, options)
    }
    return response
  }

  const userEmail = user.email?.toLowerCase()

  // Check if this is the admin
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase()
  if (adminEmail && userEmail === adminEmail) {
    return redirectWithCookies(`${origin}/admin`)
  }

  // Use service role client to bypass RLS for the client lookup
  const serviceClient = createServiceClient()

  // Check if this email belongs to a client
  const { data: client } = await serviceClient
    .from("clients")
    .select("id, auth_user_id")
    .eq("email", userEmail!)
    .single()

  if (client) {
    // Link the Supabase Auth ID to the client record if not already set
    if (!client.auth_user_id) {
      await serviceClient
        .from("clients")
        .update({ auth_user_id: user.id })
        .eq("id", client.id)
    }
    return redirectWithCookies(`${origin}/dashboard`)
  }

  // No matching client or admin -- sign them out and redirect with error
  await supabase.auth.signOut()
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent("No account found for this email. Please contact your How To Let Go Of Anxiety team member.")}`
  )
}
