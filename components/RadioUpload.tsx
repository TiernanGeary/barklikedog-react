'use client'

import { useState, useRef } from 'react'

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

    const form = new FormData()
    form.append('file', file)
    form.append('title', title.trim())

    try {
      const res = await fetch('/api/radio/upload', { method: 'POST', body: form })
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
          accept="audio/*"
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
