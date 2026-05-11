import { loadStripe, Stripe as StripeJs } from '@stripe/stripe-js'

// Stripe client-side utilities for payment processing
let stripePromise: Promise<StripeJs | null> | null = null

/**
 * Load Stripe.js (lazy loaded, singleton)
 */
export function getStripe(): Promise<StripeJs | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  }
  return stripePromise
}

/**
 * Helper to create payment intent and confirm payment
 */
export async function confirmPayment(
  stripe: StripeJs,
  elements: any,
  clientSecret: string,
  returnUrl: string
) {
  return stripe.confirmPayment({
    elements,
    clientSecret,
    redirect: 'if_required',
    confirmParams: {
      return_url: returnUrl,
    },
  })
}

/**
 * Handle payment errors and display user-friendly messages
 */
export function getPaymentErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred'

  const { type, message, code } = error

  switch (type) {
    case 'card_error':
      return `Card error: ${message}`
    case 'validation_error':
      return `Validation error: ${message}`
    default:
      return message || 'Payment failed. Please try again.'
  }
}
