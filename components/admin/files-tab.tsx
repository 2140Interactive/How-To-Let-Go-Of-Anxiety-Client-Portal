"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Upload, FileText, Image, File, Trash2, Download, CloudUpload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/format"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FileRecord {
  id: string
  filename: string
  file_type: string | null
  file_size: number | null
  storage_path: string | null
  uploaded_by: string | null
  task_id: string | null
  note: string | null
  created_at: string
}

interface Milestone {
  id: string
  name: string
}

interface FilesTabProps {
  files: FileRecord[]
  milestones: Milestone[]
  projectId: string
}

const EXT_ICONS: Record<string, typeof FileText> = {
  pdf: FileText, doc: FileText, docx: FileText, xls: FileText, xlsx: FileText,
  txt: FileText, csv: FileText,
  png: Image, jpg: Image, jpeg: Image, gif: Image, webp: Image,
}

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  return EXT_ICONS[ext] || File
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function FilesTab({ files, milestones, projectId }: FilesTabProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const deliverables = files.filter((f) => f.uploaded_by === null)
  const clientUploads = files.filter((f) => f.uploaded_by !== null)

  async function handleDelete(fileId: string) {
    if (!confirm("Delete this file? This cannot be undone.")) return
    setDeleting(fileId)
    try {
      const res = await fetch("/api/admin/file/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, projectId }),
      })
      if (!res.ok) throw new Error()
      toast.success("File deleted")
      router.refresh()
    } catch {
      toast.error("Failed to delete file")
    } finally {
      setDeleting(null)
    }
  }

  async function handleDownload(file: FileRecord) {
    try {
      const res = await fetch(`/api/admin/file/download?fileId=${file.id}`)
      if (!res.ok) throw new Error()
      const { url } = await res.json()
      
      // Fetch as blob and trigger download with filename
      const fileRes = await fetch(url)
      const blob = await fileRes.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      const link = document.createElement("a")
      link.href = blobUrl
      link.download = file.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error("Failed to download file")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-medium text-white hover:bg-amber-600"
        >
          <Upload className="h-4 w-4" />
          Upload Deliverable
        </button>
      </div>

      {/* Deliverables */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Deliverables from AWYC
        </h3>
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {deliverables.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No deliverables uploaded yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {deliverables.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  milestones={milestones}
                  onDownload={() => handleDownload(file)}
                  onDelete={() => handleDelete(file.id)}
                  isDeleting={deleting === file.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client Uploads */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Client Uploads
        </h3>
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {clientUploads.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No client uploads yet.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {clientUploads.map((file) => (
                <FileRow
                  key={file.id}
                  file={file}
                  milestones={milestones}
                  onDownload={() => handleDownload(file)}
                  onDelete={() => handleDelete(file.id)}
                  isDeleting={deleting === file.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showDialog && (
        <UploadDialog
          projectId={projectId}
          milestones={milestones}
          onClose={() => setShowDialog(false)}
          onUploaded={() => {
            setShowDialog(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  File Row                                                          */
/* ------------------------------------------------------------------ */

function FileRow({
  file,
  milestones,
  onDownload,
  onDelete,
  isDeleting,
}: {
  file: FileRecord
  milestones: Milestone[]
  onDownload: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  const Icon = getFileIcon(file.filename)
  const milestone = milestones.find((m) => m.id === file.task_id)

  return (
    <div className="flex items-center gap-3 px-4 py-3 md:px-6">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{file.filename}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {file.file_size && <span>{formatFileSize(file.file_size)}</span>}
          <span>{formatDate(file.created_at)}</span>
          {milestone && (
            <span className="rounded bg-muted px-1.5 py-0.5">{milestone.name}</span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onDownload}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Download file"
      >
        <Download className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isDeleting}
        className="rounded-md p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        aria-label="Delete file"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Upload Dialog with drag-and-drop + progress                       */
/* ------------------------------------------------------------------ */

function UploadDialog({
  projectId,
  milestones,
  onClose,
  onUploaded,
}: {
  projectId: string
  milestones: Milestone[]
  onClose: () => void
  onUploaded: () => void
}) {
  const [file, setFile] = useState<globalThis.File | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [milestoneId, setMilestoneId] = useState("")
  const [note, setNote] = useState("")
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onFileSelected = useCallback((f: globalThis.File) => {
    setFile(f)
    if (!displayName) {
      setDisplayName(f.name.replace(/\.[^.]+$/, ""))
    }
  }, [displayName])

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) onFileSelected(dropped)
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) onFileSelected(selected)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error("Please select a file")
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("projectId", projectId)
      formData.append("displayName", displayName || file.name)
      if (milestoneId && milestoneId !== "none") {
        formData.append("taskId", milestoneId)
      }
      if (note.trim()) {
        formData.append("note", note.trim())
      }

      // XMLHttpRequest for upload progress tracking
      const xhr = new XMLHttpRequest()

      await new Promise<void>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100))
          }
        })
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(xhr.responseText || "Upload failed"))
        })
        xhr.addEventListener("error", () => reject(new Error("Upload failed")))
        xhr.open("POST", "/api/admin/file/upload")
        xhr.send(formData)
      })

      toast.success("File uploaded successfully")
      onUploaded()
    } catch {
      toast.error("Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Upload Deliverable</h3>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {/* Drag-and-drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 transition-colors",
              dragging
                ? "border-amber-500 bg-amber-50"
                : file
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-border hover:border-muted-foreground/50 hover:bg-muted/50"
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
            />

            {file ? (
              <>
                <FileText className="h-8 w-8 text-emerald-600" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="text-xs text-muted-foreground underline hover:text-foreground"
                >
                  Choose a different file
                </button>
              </>
            ) : (
              <>
                <CloudUpload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Drag and drop your file here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to browse (PDF, images, documents, up to 50MB)
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Display name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Optional label for this file"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Milestone association */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Associated Milestone
            </label>
            <Select value={milestoneId} onValueChange={setMilestoneId}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="None (general file)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (general file)</SelectItem>
                {milestones.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note for client */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Note for Client (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              placeholder="Add context about this file, e.g. Here is the process map we discussed..."
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
            <p className="mt-0.5 text-right text-xs text-muted-foreground">{note.length}/500</p>
          </div>

          {/* Progress bar */}
          {uploading && (
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
