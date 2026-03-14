'use client'

import { useState, useRef } from 'react'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default function RadioUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim()) return

    setUploading(true)
    setResult(null)

    try {
      // Step 1: Upload file directly to Sanity CDN (bypasses Vercel body limit)
      const uploadRes = await fetch(
        `https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-03-10/assets/files/${SANITY_DATASET}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': file.type,
            'Content-Disposition': `attachment; filename="${file.name}"`,
          },
          body: file,
        },
      )

      if (!uploadRes.ok) {
        setResult({ type: 'error', message: 'Failed to upload file' })
        return
      }

      const uploadData = await uploadRes.json()
      const assetId = uploadData.document._id

      // Step 2: Tell our API to create the media doc and queue it
      const res = await fetch('/api/radio/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          assetId,
          filename: file.name,
          fileSize: file.size,
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

  return (
    <div className="radio-upload">
      <div className="radio-upload-header">UPLOAD A TRACK</div>
      <div className="radio-upload-hint">MP3, M4A, OGG, WAV, FLAC — max 50MB</div>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Track title"
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
