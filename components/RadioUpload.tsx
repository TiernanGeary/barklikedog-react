'use client'

import { useState, useRef } from 'react'
import type { YouTubeResult } from '@/lib/types'

const UPLOAD_PROXY = process.env.NEXT_PUBLIC_UPLOAD_PROXY_URL || ''
const MAX_DURATION = 300 // 5 minutes

export default function RadioUpload() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'search' | 'upload'>('search')
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  if (!open) {
    return (
      <div className="radio-upload">
        <button className="radio-upload-toggle" onClick={() => setOpen(true)}>
          Add a Track
        </button>
      </div>
    )
  }

  return (
    <div className="radio-upload">
      <div className="radio-upload-tabs">
        <button
          className={`radio-upload-tab ${tab === 'search' ? 'radio-upload-tab-active' : ''}`}
          onClick={() => { setTab('search'); setResult(null) }}
        >
          Search
        </button>
        <button
          className={`radio-upload-tab ${tab === 'upload' ? 'radio-upload-tab-active' : ''}`}
          onClick={() => { setTab('upload'); setResult(null) }}
        >
          Upload
        </button>
      </div>

      {tab === 'search' ? (
        <SearchTab result={result} setResult={setResult} />
      ) : (
        <UploadTab result={result} setResult={setResult} />
      )}
    </div>
  )
}

/* ─── Search Tab ─── */

function SearchTab({
  result,
  setResult,
}: {
  result: { type: 'success' | 'error'; message: string } | null
  setResult: (r: { type: 'success' | 'error'; message: string } | null) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<YouTubeResult[]>([])
  const [searching, setSearching] = useState(false)
  const [extractingId, setExtractingId] = useState<string | null>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setSearching(true)
    setResult(null)
    setResults([])

    try {
      const res = await fetch(`/api/radio/search?q=${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (res.ok && data.results) {
        setResults(data.results)
        if (data.results.length === 0) {
          setResult({ type: 'error', message: 'No results found' })
        }
      } else {
        setResult({ type: 'error', message: data.error || 'Search failed' })
      }
    } catch {
      setResult({ type: 'error', message: 'Search failed' })
    } finally {
      setSearching(false)
    }
  }

  async function handleAdd(track: YouTubeResult) {
    if (!UPLOAD_PROXY) return
    setExtractingId(track.videoId)
    setResult(null)

    try {
      // Step 1: Extract audio via VPS
      const extractRes = await fetch(`${UPLOAD_PROXY}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: track.videoId, title: track.title }),
      })

      if (!extractRes.ok) {
        const err = await extractRes.json().catch(() => ({ error: 'Extraction failed' }))
        setResult({ type: 'error', message: err.error || 'Extraction failed' })
        return
      }

      const extractData = await extractRes.json()

      // Step 2: Create media doc and queue via Vercel API
      const res = await fetch('/api/radio/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: track.title,
          assetId: extractData.assetId,
          duration: extractData.duration || track.durationSeconds,
          source: 'youtube',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setResult({ type: 'error', message: data.error || 'Failed to queue track' })
      } else {
        const msg = data.status === 'approved' ? 'Added to queue!' : 'Submitted for approval'
        setResult({ type: 'success', message: msg })
      }
    } catch {
      setResult({ type: 'error', message: 'Extraction failed' })
    } finally {
      setExtractingId(null)
    }
  }

  const tooLong = (s: number) => s > MAX_DURATION

  return (
    <div>
      <form onSubmit={handleSearch} className="radio-search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a song..."
          className="radio-upload-title"
          disabled={searching || !!extractingId}
        />
        <button
          type="submit"
          disabled={searching || !query.trim() || !!extractingId}
          className="radio-upload-btn"
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {results.length > 0 && (
        <ul className="radio-search-results">
          {results.map((r) => (
            <li key={r.videoId} className="radio-search-result">
              <div className="radio-search-info">
                <span className="radio-search-title">{r.title}</span>
                <span className="radio-search-meta">
                  {r.artist} · {r.durationText}
                </span>
              </div>
              {tooLong(r.durationSeconds) ? (
                <span className="radio-search-limit">5 min max</span>
              ) : (
                <button
                  className="radio-upload-btn"
                  disabled={!!extractingId}
                  onClick={() => handleAdd(r)}
                >
                  {extractingId === r.videoId ? 'Extracting...' : 'Add'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {result && (
        <div className={result.type === 'error' ? 'radio-upload-error' : 'radio-upload-success'}>
          {result.message}
        </div>
      )}
    </div>
  )
}

/* ─── Upload Tab ─── */

function UploadTab({
  result,
  setResult,
}: {
  result: { type: 'success' | 'error'; message: string } | null
  setResult: (r: { type: 'success' | 'error'; message: string } | null) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function getAudioDuration(f: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(f)
      const audio = new Audio()
      audio.addEventListener('loadedmetadata', () => {
        const dur = audio.duration
        URL.revokeObjectURL(url)
        resolve(dur)
      })
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url)
        reject(new Error('Could not read audio duration'))
      })
      audio.src = url
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim() || !UPLOAD_PROXY) return

    setUploading(true)
    setResult(null)

    try {
      // Check duration client-side
      let duration: number | undefined
      try {
        duration = await getAudioDuration(file)
        if (duration > MAX_DURATION) {
          setResult({ type: 'error', message: 'Track exceeds 5 minute limit' })
          return
        }
      } catch {
        // If we can't read duration, let the server handle it
      }

      // Step 1: Upload file to Sanity via VPS proxy
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

      // Step 2: Create media doc and queue
      const res = await fetch('/api/radio/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          assetId,
          mimeType: file.type,
          duration: duration ? Math.round(duration) : undefined,
          source: 'upload',
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
    <div>
      <div className="radio-upload-hint">MP3, M4A, OGG, WAV, FLAC — max 50MB, 5 min limit</div>
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
