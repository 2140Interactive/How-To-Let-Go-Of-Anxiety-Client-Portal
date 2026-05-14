"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Show errors from auth callback redirects
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) setError(errorParam)
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="relative flex h-20 w-full items-center rounded-xl bg-[var(--awyc-primary)] px-6 py-3">
            <Image
              src="/images/How_to_Let_Go_of_Anxiety_Logo_white.png"
              alt="How To Let Go Of Anxiety"
              fill
              className="object-contain p-3"
              sizes="384px"
              priority
            />
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--awyc-teal-success)]/10">
                <svg
                  className="h-6 w-6 text-[var(--awyc-teal-success)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-foreground">
                Check your email
              </h1>
              <p className="text-sm text-muted-foreground">
                {"We've sent a sign-in link to "}
                <span className="font-medium text-foreground">{email}</span>
                {". Click the link in the email to access your portal."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSent(false)
                  setEmail("")
                }}
                className="mt-2 text-sm font-medium text-[var(--awyc-primary)] hover:text-[var(--awyc-primary-dark)]"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-lg font-semibold text-foreground">
                  Sign in to your portal
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {"Enter your email and we'll send you a magic link."}
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="mt-1 block text-xs font-medium underline underline-offset-2"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--awyc-primary)]/40"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="h-11 rounded-lg bg-[var(--awyc-primary)] text-sm font-semibold text-white transition-colors hover:bg-[var(--awyc-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Magic Link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
