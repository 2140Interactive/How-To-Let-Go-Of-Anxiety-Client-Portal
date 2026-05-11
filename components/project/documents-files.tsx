"use client"

import { useState } from "react"
import { FileText, Image, File, Download } from "lucide-react"
import { toast } from "sonner"

interface FileRecord {
  id: string
  filename: string
  storage_path: string
  file_type: string | null
  file_size: number | null
  note: string | null
  created_at: string
  task_id: string | null
  uploaded_by: string | null
}

interface DocumentsFilesProps {
  files: FileRecord[]
  clientId: string
}

const DEFAULT_VISIBLE = 3

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("T")[0].split("-").map(Number)
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${monthNames[month - 1]} ${day}, ${year}`
}

function FileIcon({ fileType }: { fileType: string | null }) {
  if (fileType?.startsWith("image/")) {
    return <Image className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  }
  if (fileType?.includes("pdf") || fileType?.includes("document") || fileType?.includes("text")) {
    return <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
  }
  return <File className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
}

async function handleDownload(fileId: string, filename: string) {
  try {
    const res = await fetch(`/api/file/download?fileId=${fileId}`)
    if (!res.ok) throw new Error()
    const { url } = await res.json()
    
    // Fetch as blob and trigger download with filename
    const fileRes = await fetch(url)
    const blob = await fileRes.blob()
    const blobUrl = URL.createObjectURL(blob)
    
    const link = document.createElement("a")
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch {
    toast.error("Failed to download file")
  }
}

function FileRow({ file }: { file: FileRecord }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-3">
      <FileIcon fileType={file.file_type} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.filename}</p>
        {file.note && (
          <p className="mt-0.5 text-sm text-muted-foreground">{file.note}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.file_size)}
          {file.file_size ? " \u00B7 " : ""}
          {formatDate(file.created_at)}
        </p>
      </div>
      <button
        type="button"
        onClick={() => handleDownload(file.id, file.filename)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={`Download ${file.filename}`}
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  )
}

function FileCategory({ title, files }: { title: string; files: FileRecord[] }) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = files.length > DEFAULT_VISIBLE
  const visibleFiles = expanded ? files : files.slice(0, DEFAULT_VISIBLE)

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-col gap-2">
        {visibleFiles.map((file) => (
          <FileRow key={file.id} file={file} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-sm text-muted-foreground hover:text-foreground"
        >
          {expanded ? "Show Less" : `View All (${files.length})`}
        </button>
      )}
    </div>
  )
}

export function DocumentsFiles({ files, clientId }: DocumentsFilesProps) {
  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Documents & Files
        </h2>
        <p className="py-4 text-center text-sm text-muted-foreground">
          No documents yet. Files will appear here as your project progresses.
        </p>
      </div>
    )
  }

  const deliverables = files.filter((f) => f.uploaded_by !== clientId)
  const uploaded = files.filter((f) => f.uploaded_by === clientId)

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-6 shadow-sm md:px-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Documents & Files
      </h2>
      <div className="flex flex-col gap-5">
        {deliverables.length > 0 && (
          <FileCategory title="Deliverables from AWYC" files={deliverables} />
        )}
        {uploaded.length > 0 && (
          <FileCategory title="Files You Uploaded" files={uploaded} />
        )}
      </div>
    </div>
  )
}
