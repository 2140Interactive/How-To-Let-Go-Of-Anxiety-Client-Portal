import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  getOrCreateStripeCustomer,
  createPaymentIntent,
} from '@/lib/stripe/stripe-server'

export async function POST(request: Request) {
  try {
    // Get authenticated user
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, paymentId, description } = await request.json()

    if (!projectId || !paymentId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Look up existing payment record
    const { data: existingPayment, error: paymentLookupError } = await supabase
      .from('payments')
      .select('id, amount, description, status')
      .eq('id', paymentId)
      .eq('project_id', projectId)
      .single()

    if (paymentLookupError || !existingPayment) {
      return Response.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (existingPayment.status === 'paid') {
      return Response.json({ error: 'Payment already completed' }, { status: 400 })
    }

    // Get project and client info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, client_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get client info
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('email')
      .eq('id', project.client_id)
      .single()

    if (clientError || !client) {
      return Response.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      projectId,
      project.name,
      client.email,
      supabase
    )

    // Convert dollars to cents for Stripe
    const amountInCents = Math.round(existingPayment.amount * 100)

    // Create PaymentIntent
    const paymentIntent = await createPaymentIntent(
      stripeCustomerId,
      amountInCents,
      'usd',
      description || existingPayment.description || 'Payment'
    )

    // Update existing payment with Stripe IDs (do not create new record)
    console.log('[v0] Updating payment record with Stripe IDs')
    console.log('[v0] Payment ID being updated:', paymentId)
    console.log('[v0] PaymentIntent ID being stored:', paymentIntent.id)
    console.log('[v0] Stripe Customer ID being stored:', stripeCustomerId)
    
    const { data: updateData, error: updateError } = await supabase
      .from('payments')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        stripe_customer_id: stripeCustomerId,
      })
      .eq('id', paymentId)
      .select('id, stripe_payment_intent_id')
      .single()

    console.log('[v0] Update result - data:', JSON.stringify(updateData, null, 2))
    console.log('[v0] Update result - error:', JSON.stringify(updateError, null, 2))

    if (updateError) {
      console.error('[v0] Error updating payment with Stripe IDs:', updateError)
      return Response.json(
        { error: 'Failed to update payment record' },
        { status: 500 }
      )
    }
    
    console.log('[v0] Successfully stored PaymentIntent ID in database')

    return Response.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
    })
  } catch (error: any) {
    console.error('[v0] Error creating payment intent:', error)
    return Response.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    )
  }
}
