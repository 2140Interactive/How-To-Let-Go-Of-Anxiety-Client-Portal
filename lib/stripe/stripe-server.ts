import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

/**
 * Get or create a Stripe customer for a project
 */
export async function getOrCreateStripeCustomer(
  projectId: string,
  projectName: string,
  clientEmail: string,
  supabase: any
): Promise<string> {
  // Check if customer already exists in our mapping
  const { data: existingCustomer } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('project_id', projectId)
    .single()

  if (existingCustomer) {
    return existingCustomer.stripe_customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: clientEmail,
    description: projectName,
    metadata: {
      project_id: projectId,
    },
  })

  // Store mapping in database
  await supabase.from('stripe_customers').insert({
    project_id: projectId,
    stripe_customer_id: customer.id,
  })

  return customer.id
}

/**
 * Create a PaymentIntent for a one-time payment
 */
export async function createPaymentIntent(
  stripeCustomerId: string,
  amountInCents: number,
  currency: string = 'usd',
  description?: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    customer: stripeCustomerId,
    description,
    metadata: {
      created_at: new Date().toISOString(),
    },
  })
}

/**
 * Create an Invoice for a recurring/scheduled payment
 */
export async function createInvoice(
  stripeCustomerId: string,
  amountInCents: number,
  currency: string = 'usd',
  description?: string,
  dueDate?: Date
): Promise<Stripe.Invoice> {
  const invoiceData: Stripe.InvoiceCreateParams = {
    customer: stripeCustomerId,
    currency,
    description,
    collection_method: 'send_invoice',
    days_until_due: dueDate
      ? Math.ceil(
          (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : 7,
  }

  const invoice = await stripe.invoices.create(invoiceData)

  // Add a line item to the invoice
  await stripe.invoiceItems.create({
    customer: stripeCustomerId,
    invoice: invoice.id,
    amount: amountInCents,
    currency,
    description: description || 'Payment',
  })

  return stripe.invoices.retrieve(invoice.id)
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''
  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}

/**
 * Handle payment_intent.succeeded webhook
 */
export async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
): Promise<void> {
  console.log('[v0] handlePaymentIntentSucceeded called with:', paymentIntent.id)
  
  const { data: payment, error } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .select()
    .single()

  console.log('[v0] handlePaymentIntentSucceeded result:', { payment, error })

  if (error) {
    console.error('[v0] Error updating payment on success:', error)
    throw error
  }

  return payment
}

/**
 * Handle payment_intent.payment_failed webhook
 */
export async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  supabase: any
): Promise<void> {
  await supabase
    .from('payments')
    .update({
      status: 'failed',
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
}

/**
 * Handle invoice.payment_succeeded webhook
 */
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice,
  supabase: any
): Promise<void> {
  await supabase
    .from('payments')
    .update({
      status: 'paid',
      stripe_invoice_id: invoice.id,
    })
    .eq('stripe_invoice_id', invoice.id)
}
