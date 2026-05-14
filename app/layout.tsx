import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { StripeProvider } from "@/components/payment/stripe-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "HTLGOA Client Portal",
  description:
    "Your project status portal. Check milestones, respond to requests, and stay up to date.",
}

export const viewport: Viewport = {
  themeColor: "#136288",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <StripeProvider>
          {children}
        </StripeProvider>
      </body>
    </html>
  )
}
