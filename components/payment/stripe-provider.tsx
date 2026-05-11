'use client'

import { ReactNode } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe/stripe-client'

export function StripeProvider({ children }: { children: ReactNode }) {
  const stripePromise = getStripe()

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  )
}
