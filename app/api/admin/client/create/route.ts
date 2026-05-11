import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { adminSideEffects } from "@/lib/admin-api-helpers"

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    const body = await request.json()
    const {
      mode,
      // New client fields
      firstName,
      lastName,
      email,
      phone,
      companyName,
      // Existing client fields
      clientId,
      // Project fields
      projectName,
      projectValue,
      adminName,
    } = body

    // Validate required fields
    if (!projectName || projectValue === undefined || projectValue === null) {
      return NextResponse.json(
        { error: "Project name and value are required" },
        { status: 400 }
      )
    }

    let finalClientId = clientId
    let resolvedCompanyName = companyName

    // If new client mode, create the client first
    if (mode === "new") {
      if (!firstName || !lastName || !email || !companyName) {
        return NextResponse.json(
          { error: "First name, last name, email, and company name are required for new clients" },
          { status: 400 }
        )
      }

      // Check if client with this email already exists
      const { data: existingClient } = await supabase
        .from("clients")
        .select("id")
        .eq("email", email)
        .single()

      if (existingClient) {
        return NextResponse.json(
          { error: "A client with this email already exists" },
          { status: 400 }
        )
      }

      // Create the client
      const { data: newClient, error: clientError } = await supabase
        .from("clients")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone || null,
          company_name: companyName,
        })
        .select("id")
        .single()

      if (clientError) {
        console.error("Error creating client:", clientError)
        return NextResponse.json(
          { error: "Failed to create client" },
          { status: 500 }
        )
      }

      finalClientId = newClient.id
    } else {
      // Existing client mode - validate clientId and fetch company name
      if (!clientId) {
        return NextResponse.json(
          { error: "Client selection is required" },
          { status: 400 }
        )
      }

      // Fetch company name from existing client
      const { data: existingClient, error: fetchError } = await supabase
        .from("clients")
        .select("company_name")
        .eq("id", clientId)
        .single()

      if (fetchError || !existingClient) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        )
      }

      resolvedCompanyName = existingClient.company_name
    }

    // Create the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        client_id: finalClientId,
        name: projectName,
        total_value: projectValue,
        project_type: "build",
        status: "new",
      })
      .select("id, name")
      .single()

    if (projectError) {
      console.error("Error creating project:", projectError)
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      )
    }

    // Insert default milestones
    let milestonesWarning: string | undefined
    const defaultMilestones = [
      { project_id: project.id, name: 'Discovery & Planning', short_label: 'Discovery', order: 1, status: 'upcoming' },
      { project_id: project.id, name: 'Process Mapping', short_label: 'Mapping', order: 2, status: 'upcoming' },
      { project_id: project.id, name: 'Plan Approval', short_label: 'Plan Approval', order: 3, status: 'upcoming' },
      { project_id: project.id, name: 'Build', short_label: 'Build', order: 4, status: 'upcoming' },
      { project_id: project.id, name: 'Testing & QA', short_label: 'Testing', order: 5, status: 'upcoming' },
      { project_id: project.id, name: 'Build Approval', short_label: 'Build Approval', order: 6, status: 'upcoming' },
      { project_id: project.id, name: 'Training', short_label: 'Training', order: 7, status: 'upcoming' },
      { project_id: project.id, name: 'Go Live', short_label: 'Live', order: 8, status: 'upcoming' },
    ]

    const { error: milestonesError } = await supabase
      .from("milestones")
      .insert(defaultMilestones)

    if (milestonesError) {
      console.error("Error creating milestones:", milestonesError)
      milestonesWarning = "Project created but default milestones could not be added"
    }

    // Create project storage folders
    let storageWarning: string | undefined
    try {
      const storage = supabase.storage
      const bucketName = "project_files"

      // Determine the folder path based on mode
      let folderPath: string
      if (mode === "new") {
        // New client: projects/{projectName}/
        folderPath = `projects/${encodeURIComponent(projectName)}/`
      } else {
        // Existing client: clients/{companyName}/projects/{projectName}/
        folderPath = `clients/${encodeURIComponent(resolvedCompanyName)}/projects/${encodeURIComponent(projectName)}/`
      }

      // Create a placeholder file to establish the folder structure
      const placeholderPath = `${folderPath}.placeholder`
      const { error: storageError } = await storage
        .from(bucketName)
        .upload(placeholderPath, new Blob([""], { type: "text/plain" }), {
          upsert: true,
        })

      if (storageError) {
        console.error("Error creating project storage folder:", storageError)
        storageWarning = "Project created but storage folder could not be initialized"
      }
    } catch (storageException) {
      console.error("Storage operation failed:", storageException)
      storageWarning = "Project created but storage folder could not be initialized"
    }

    // Create activity entry and fire webhook
    await adminSideEffects({
      projectId: project.id,
      adminName,
      activity: {
        type: "message",
        title: "Project created",
        description: `New project "${projectName}" has been set up.`,
      },
      webhook: {
        event: "client_project_created",
        mode,
        clientId: finalClientId,
        firstName: mode === "new" ? firstName : undefined,
        lastName: mode === "new" ? lastName : undefined,
        email: mode === "new" ? email : undefined,
        phone: mode === "new" ? (phone || null) : undefined,
        companyName: mode === "new" ? companyName : undefined,
        projectName,
        projectValue,
        projectType: "build",
      },
    })

    return NextResponse.json({
      success: true,
      clientId: finalClientId,
      projectId: project.id,
      projectName: project.name,
      warning: milestonesWarning,
      storageWarning: storageWarning,
    })
  } catch (error) {
    console.error("Unhandled error in client/create:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch clients list and project types
export async function GET() {
  try {
    const supabase = createServiceClient()

    // Fetch all clients
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, first_name, last_name, company_name")
      .order("last_name", { ascending: true })

    if (clientsError) {
      console.error("Error fetching clients:", clientsError)
      return NextResponse.json(
        { error: "Failed to fetch clients" },
        { status: 500 }
      )
    }

    // Fetch distinct project types
    const { data: projectTypes, error: typesError } = await supabase
      .from("projects")
      .select("project_type")

    if (typesError) {
      console.error("Error fetching project types:", typesError)
      return NextResponse.json(
        { error: "Failed to fetch project types" },
        { status: 500 }
      )
    }

    // Extract unique project types
    const uniqueTypes = [...new Set(projectTypes?.map(p => p.project_type).filter(Boolean))]

    return NextResponse.json({
      clients: clients || [],
      projectTypes: uniqueTypes,
    })
  } catch (error) {
    console.error("Unhandled error in client/create GET:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
