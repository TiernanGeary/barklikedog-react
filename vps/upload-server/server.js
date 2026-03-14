require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const { extractAudio, updateYtdlp } = require('./lib/extract')
const { uploadToSanityCDN } = require('./lib/sanity')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Rate limiting: 5 extractions per IP per hour
const rateLimitMap = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 })
    return true
  }
  if (entry.count >= 5) return false
  entry.count++
  return true
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// YouTube extraction → Sanity CDN
app.post('/extract', async (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' })
  }

  const { videoId } = req.body
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).json({ error: 'Invalid videoId' })
  }

  let filePath = null
  try {
    const result = await extractAudio(videoId)
    filePath = result.filePath

    const fileBuffer = fs.readFileSync(filePath)
    const sanityData = await uploadToSanityCDN(fileBuffer)
    const assetId = sanityData.document._id

    res.json({ assetId, duration: result.duration })
  } catch (err) {
    console.error('[extract] error:', err.message)
    const status = err.statusCode || 500
    res.status(status).json({ error: err.message })
  } finally {
    if (filePath) {
      try { fs.unlinkSync(filePath) } catch {}
    }
  }
})

// File upload proxy → Sanity CDN
app.post('/upload', async (req, res) => {
  const chunks = []
  req.on('data', (chunk) => chunks.push(chunk))
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks)
      if (buffer.length === 0) {
        return res.status(400).json({ error: 'Empty request body' })
      }

      const contentType = req.headers['content-type'] || 'audio/mpeg'
      const sanityData = await uploadToSanityCDN(buffer, contentType)
      const assetId = sanityData.document._id

      res.json({ assetId })
    } catch (err) {
      console.error('[upload] error:', err.message)
      res.status(500).json({ error: err.message })
    }
  })
})

// Start server
app.listen(PORT, async () => {
  console.log(`Upload server listening on port ${PORT}`)
  await updateYtdlp()
  console.log('Ready to accept requests')
})
