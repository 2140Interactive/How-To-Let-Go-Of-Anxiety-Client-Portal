import { Resend } from "resend"
import { createServiceClient } from "@/lib/supabase/service"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_EMAIL = "hello@portal.howtoletgoofanxiety.com"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return Response.json({ error: "Missing projectId" }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Fetch project and client info
    const { data: project } = await serviceClient
      .from("projects")
      .select("name, client_id, welcome_email_sent_at")
      .eq("id", projectId)
      .single()

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 })
    }

    const { data: client } = await serviceClient
      .from("clients")
      .select("email, first_name")
      .eq("id", project.client_id)
      .single()

    if (!client?.email) {
      return Response.json({ error: "Client email not found" }, { status: 404 })
    }

    // Determine which template to use based on whether this is first send or resend
    const isFirstSend = !project.welcome_email_sent_at
    const emailSubject = isFirstSend
      ? "Welcome to How To Let Go Of Anxiety"
      : `New Project: ${project.name}`

    // HTML email content based on template type
    const emailHtml = isFirstSend
      ? getNewClientWelcomeTemplate(client.first_name, project.name)
      : getExistingClientProjectTemplate(client.first_name, project.name)

    // Send email via Resend
    await resend.emails.send({
      from: `How To Let Go Of Anxiety <${FROM_EMAIL}>`,
      to: client.email,
      subject: emailSubject,
      html: emailHtml,
    })

    // Update project with welcome_email_sent_at timestamp
    const { data: updated, error: updateError } = await serviceClient
      .from("projects")
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq("id", projectId)
      .select()
      .single()

    if (updateError) {
      console.error("Failed to update welcome_email_sent_at:", updateError)
      // Don't fail the response - email was sent successfully
    }

    return Response.json({ success: true, isFirstSend, data: updated })
  } catch (error) {
    console.error("Welcome email error:", error)
    return Response.json(
      { error: "Failed to send welcome email" },
      { status: 500 }
    )
  }
}

function getNewClientWelcomeTemplate(
  firstName: string,
  projectName: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">

  <div style="border-top: 4px solid #5095A3; padding-top: 28px;">

    <p style="font-size: 20px; color: #5095A3; font-weight: bold; margin: 0 0 24px;">Welcome to Your Project Portal</p>

    <p style="margin: 0 0 16px;">Hi ${firstName},</p>

    <p style="margin: 0 0 16px;">We're excited to kick off your ${projectName} project. Your dedicated portal is now ready, and you can start collaborating with our team right away.</p>

    <p style="margin: 0 0 28px;">
      <a href="${process.env.NEXT_PUBLIC_PORTAL_URL}/login" style="background-color: #5095A3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px; display: inline-block;">Access Your Portal</a>
    </p>

    <p style="margin: 0 0 16px;"><strong>What's Next:</strong></p>
    <ul style="margin: 0 0 24px; padding-left: 20px;">
      <li style="margin: 0 0 8px;">Review your project timeline and milestones</li>
      <li style="margin: 0 0 8px;">Check for any pending payments</li>
      <li style="margin: 0 0 8px;">Upload any required documents</li>
      <li style="margin: 0 0 8px;">Track project progress in real-time</li>
    </ul>

    <p style="margin: 0 0 8px;">Thank you for partnering with us.</p>

    <p style="margin: 0; color: #5095A3; font-weight: bold;">Andreas</p>
    <p style="margin: 4px 0 0; color: #888888; font-size: 14px;">How To Let Go Of Anxiety</p>

  </div>

</body>
</html>
  `
}

function getExistingClientProjectTemplate(
  firstName: string,
  projectName: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; color: #333333; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">

  <div style="border-top: 4px solid #5095A3; padding-top: 28px;">

    <p style="font-size: 20px; color: #5095A3; font-weight: bold; margin: 0 0 24px;">New Project Added</p>

    <p style="margin: 0 0 16px;">Hi ${firstName},</p>

    <p style="margin: 0 0 16px;">A new project has been added to your account. Your ${projectName} project is now ready to access through your portal.</p>

    <p style="margin: 0 0 28px;">
      <a href="${process.env.NEXT_PUBLIC_PORTAL_URL}/login" style="background-color: #5095A3; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 15px; display: inline-block;">View Project</a>
    </p>

    <p style="margin: 0 0 8px;">Thank you for your business.</p>

    <p style="margin: 0; color: #5095A3; font-weight: bold;">Andreas</p>
    <p style="margin: 4px 0 0; color: #888888; font-size: 14px;">How To Let Go Of Anxiety</p>

  </div>

</body>
</html>
  `
}
