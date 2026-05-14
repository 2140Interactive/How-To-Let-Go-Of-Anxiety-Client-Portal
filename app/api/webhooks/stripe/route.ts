import { createServiceClient } from '@/lib/supabase/service'
import {
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handleInvoicePaymentSucceeded,
  verifyWebhookSignature,
} from '@/lib/stripe/stripe-server'
import { adminSideEffects } from '@/lib/admin-api-helpers'
import { Resend } from 'resend'
import Stripe from 'stripe'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = 'hello@portal.howtoletgoofanxiety.com'

export async function POST(request: Request) {
  console.log('[v0] Stripe webhook received')
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') || ''
  console.log('[v0] Webhook signature present:', !!signature)

  let event: Stripe.Event

  try {
    event = verifyWebhookSignature(body, signature)
    console.log('[v0] Webhook signature verified, event type:', event.type)
  } catch (err: any) {
    console.error('[v0] Webhook signature verification failed:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('[v0] Processing payment_intent.succeeded')
        console.log('[v0] PaymentIntent ID from Stripe:', paymentIntent.id)
        console.log('[v0] PaymentIntent amount:', paymentIntent.amount)
        console.log('[v0] PaymentIntent status:', paymentIntent.status)
        
        // First, check ALL payments to see what stripe_payment_intent_id values exist
        const { data: allPayments, error: allError } = await supabase
          .from('payments')
          .select('id, stripe_payment_intent_id, status, amount')
          .order('created_at', { ascending: false })
          .limit(5)
        
        console.log('[v0] Recent 5 payments in DB:', JSON.stringify(allPayments, null, 2))
        console.log('[v0] All payments query error:', allError)
        
        // Now try to find the specific payment using maybeSingle to avoid PGRST204 error
        console.log('[v0] Looking for payment with stripe_payment_intent_id:', paymentIntent.id)
        const { data: payment, error: lookupError } = await supabase
          .from('payments')
          .select('id, project_id, amount, description, stripe_payment_intent_id, status')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .maybeSingle()

        console.log('[v0] Payment lookup result - found:', !!payment)
        console.log('[v0] Payment lookup result - data:', JSON.stringify(payment, null, 2))
        console.log('[v0] Payment lookup result - error:', JSON.stringify(lookupError, null, 2))

        if (!payment) {
          console.warn('[v0] No payment found matching PaymentIntent ID:', paymentIntent.id)
          // Return 200 to Stripe so it stops retrying
          return Response.json({ received: true, warning: 'No matching payment found' })
        }

        console.log('[v0] Found payment, calling handlePaymentIntentSucceeded')
        await handlePaymentIntentSucceeded(paymentIntent, supabase)

          // Create activity entry with client-friendly language
          const formattedAmount = (paymentIntent.amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          await adminSideEffects({
            projectId: payment.project_id,
            adminName: null,
            activity: {
              type: 'payment_received',
              title: `Payment of $${formattedAmount} received. Thank you!`,
              description: null,
            },
            notification: {
              type: 'payment',
              title: `Payment confirmed`,
              message: `Your payment of $${formattedAmount} has been received. Thank you!`,
            },
          })

          // Send email confirmation to client
          const { data: project } = await supabase
            .from('projects')
            .select('name, welcome_email_sent_at, clients(first_name, email)')
            .eq('id', payment.project_id)
            .single()

          const clientRecord = project?.clients as unknown as { first_name: string; email: string } | null
          if (clientRecord?.email && project?.welcome_email_sent_at) {
            try {
              await resend.emails.send({
                from: `How To Let Go Of Anxiety <${FROM_EMAIL}>`,
                to: clientRecord.email,
                subject: `Payment Received: $${formattedAmount}`,
                html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
  <div style="border-top: 4px solid #5095A3; padding-top: 28px;">
    <p style="font-size: 20px; color: #5095A3; font-weight: bold; margin: 0 0 24px;">Payment Received</p>
    <p style="margin: 0 0 16px;">Hi ${clientRecord.first_name},</p>
    <p style="margin: 0 0 16px;">Thank you! We have received your payment for your <strong>${project.name}</strong> project.</p>
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 0 0 24px;">
      <p style="margin: 0;"><strong>Amount:</strong> $${formattedAmount}</p>
    </div>
    <p style="margin: 0 0 28px;">
      <a href="${process.env.NEXT_PUBLIC_PORTAL_URL}/project/${payment.project_id}#payments" style="background-color: #5095A3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px; display: inline-block;">View Invoice</a>
    </p>
    <p style="margin: 0 0 8px;">Thank you.</p>
    <p style="margin: 0; color: #5095A3; font-weight: bold;">Andreas</p>
    <p style="margin: 4px 0 0; color: #888888; font-size: 14px;">How To Let Go Of Anxiety</p>
  </div>
</body>
</html>
                `,
              })
            } catch (emailError) {
              console.error('Failed to send payment confirmation email:', emailError)
            }
          }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const { data: payment } = await supabase
          .from('payments')
          .select('project_id')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single()

        if (payment) {
          await handlePaymentIntentFailed(paymentIntent, supabase)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const { data: payment } = await supabase
          .from('payments')
          .select('project_id, amount')
          .eq('stripe_invoice_id', invoice.id)
          .single()

        if (payment) {
          await handleInvoicePaymentSucceeded(invoice, supabase)

          // Create activity entry with client-friendly language
          const invoiceAmount = (payment.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          await adminSideEffects({
            projectId: payment.project_id,
            adminName: null,
            activity: {
              type: 'payment_received',
              title: `Payment of $${invoiceAmount} received. Thank you!`,
              description: null,
            },
          })
        }
        break
      }

      default:
        console.log(`[v0] Unhandled webhook event type: ${event.type}`)
    }

    return Response.json({ received: true }, { status: 200 })
  } catch (err: any) {
    console.error('[v0] Webhook processing error:', err.message)
    console.error('[v0] Webhook error stack:', err.stack)
    console.error('[v0] Webhook error full:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    return Response.json({ error: 'Webhook processing failed', message: err.message }, { status: 500 })
  }
}
