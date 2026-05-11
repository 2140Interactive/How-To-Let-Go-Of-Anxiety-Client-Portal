"use client"

import { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { X, Loader2, CheckCircle } from "lucide-react"

interface PaymentElementDialogProps {
  projectId: string
  paymentId: string
  amount: number // In dollars, API converts to cents
  description?: string
  onClose: () => void
  onSuccess: () => void
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

export function PaymentElementDialog({
  projectId,
  paymentId,
  amount,
  description,
  onClose,
  onSuccess,
}: PaymentElementDialogProps) {
  const [clientSecret, setClientSecret] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    // Lock body scroll when modal opens
    document.body.style.overflow = "hidden"
    return () => {
      // Restore scroll when modal closes
      document.body.style.overflow = "unset"
    }
  }, [])

  useEffect(() => {
    const initializePayment = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await fetch("/api/payment/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            paymentId,
            description,
          }),
        })

        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || "Failed to initialize payment")
        }

        setClientSecret(data.clientSecret)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Payment initialization failed"
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    initializePayment()
  }, [projectId, paymentId, description])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md max-h-[90vh] rounded-xl bg-card shadow-xl flex flex-col">
        {/* Header - Sticky */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Pay Invoice</h3>
            <p className="text-sm text-muted-foreground">
              Amount: ${amount.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {clientSecret && !loading && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#f59e0b",
                  },
                },
              }}
            >
              <CheckoutForm onSuccess={onSuccess} onClose={onClose} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}

function CheckoutForm({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void
  onClose: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string>("")
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setProcessing(true)
    setError("")

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success`,
      },
      redirect: "if_required",
    })

    if (submitError) {
      setError(submitError.message || "Payment failed")
      setProcessing(false)
    } else {
      // Show success state for 2 seconds before closing
      setShowSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    }
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="rounded-full bg-emerald-100 p-3">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <p className="text-lg font-semibold text-foreground">Payment successful!</p>
        <p className="text-sm text-muted-foreground">Closing...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Footer - Sticky */}
      <div className="sticky bottom-0 left-0 right-0 flex justify-end gap-2 pt-4 bg-card border-t border-border -mx-6 px-6 pb-6">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="h-10 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {processing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Pay Now"
          )}
        </button>
      </div>
    </form>
  )
}
