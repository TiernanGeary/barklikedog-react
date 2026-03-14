'use client'

import { useState, useRef } from 'react'

const UPLOAD_PROXY = process.env.NEXT_PUBLIC_UPLOAD_PROXY_URL || ''

export default function RadioUpload() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim() || !UPLOAD_PROXY) return

    setUploading(true)
    setResult(null)

    try {
      // Step 1: Upload file to Sanity via VPS proxy (bypasses Vercel size limit)
      const uploadRes = await fetch(`${UPLOAD_PROXY}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          'X-Filename': file.name,
        },
        body: file,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({ error: 'Upload failed' }))
        setResult({ type: 'error', message: err.error || 'Upload failed' })
        return
      }

      const uploadData = await uploadRes.json()
      const assetId = uploadData.document._id

      // Step 2: Create media doc and queue it via Vercel API (tiny JSON payload)
      const res = await fetch('/api/radio/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          assetId,
          mimeType: file.type,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Upload failed' })
      } else {
        const msg = data.status === 'approved' ? 'Added to queue!' : 'Submitted for approval'
        setResult({ type: 'success', message: msg })
        setFile(null)
        setTitle('')
        if (fileRef.current) fileRef.current.value = ''
      }
    } catch {
      setResult({ type: 'error', message: 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  if (!open) {
    return (
      <div className="radio-upload">
        <button
          className="radio-upload-toggle"
          onClick={() => setOpen(true)}
        >
          Upload a Track
        </button>
      </div>
    )
  }

  return (
    <div className="radio-upload">
      <div className="radio-upload-hint">MP3, M4A, OGG, WAV, FLAC — max 50MB</div>
      <form onSubmit={handleSubmit}>
        <label className="radio-upload-label">Track Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="radio-upload-title"
          disabled={uploading}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".mp3,.m4a,.ogg,.wav,.flac,.aac,.webm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="radio-upload-file"
          disabled={uploading}
        />
        <button
          type="submit"
          disabled={uploading || !file || !title.trim()}
          className="radio-upload-btn"
        >
          {uploading ? 'Uploading...' : 'Submit'}
        </button>
      </form>
      {result && (
        <div className={result.type === 'error' ? 'radio-upload-error' : 'radio-upload-success'}>
          {result.message}
        </div>
      )}
    </div>
  )
}
