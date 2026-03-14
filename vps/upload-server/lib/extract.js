const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')

const TIMEOUT = 90_000
const COOKIES = process.env.YTDLP_COOKIES

// Three retry strategies with different YouTube player clients
const STRATEGIES = [
  { name: 'default', args: [] },
  { name: 'ios', args: ['--extractor-args', 'youtube:player_client=ios'] },
  { name: 'tv_embedded', args: ['--extractor-args', 'youtube:player_client=tv_embedded'] },
]

function run(cmd, args, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const proc = execFile(cmd, args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        err.stderr = stderr
        reject(err)
      } else {
        resolve({ stdout, stderr })
      }
    })
  })
}

/**
 * Auto-update yt-dlp. Called once on server startup.
 */
async function updateYtdlp() {
  try {
    const { stdout } = await run('yt-dlp', ['--update'], 30_000)
    console.log('[yt-dlp update]', stdout.trim())
  } catch (err) {
    console.warn('[yt-dlp update] failed (non-fatal):', err.message)
  }
}

/**
 * Extract audio from a YouTube video.
 * Tries multiple player clients if extraction fails.
 * Returns { filePath, duration }.
 */
async function extractAudio(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`
  const tmpFile = path.join('/tmp', `yt-${videoId}-${Date.now()}.mp3`)

  let lastError = null

  for (const strategy of STRATEGIES) {
    console.log(`[extract] trying strategy: ${strategy.name} for ${videoId}`)
    try {
      const args = [
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', tmpFile,
        '--no-playlist',
        '--retries', '3',
        '--socket-timeout', '30',
        '--print', 'duration',
        ...strategy.args,
      ]
      if (COOKIES) args.push('--cookies', COOKIES)
      args.push(url)

      const { stdout } = await run('yt-dlp', args, TIMEOUT)

      // Parse duration from --print output (last line before file output)
      let duration = 0
      const lines = stdout.trim().split('\n')
      for (const line of lines) {
        const num = parseFloat(line)
        if (!isNaN(num) && num > 0) {
          duration = Math.round(num)
          break
        }
      }

      return { filePath: tmpFile, duration }
    } catch (err) {
      lastError = err
      console.warn(`[extract] strategy ${strategy.name} failed:`, err.message)
      // Clean up partial file before retry
      try { fs.unlinkSync(tmpFile) } catch {}
    }
  }

  // All strategies exhausted
  const msg = lastError?.stderr || lastError?.message || 'Unknown error'
  if (lastError?.killed) {
    const err = new Error('Extraction timed out')
    err.statusCode = 504
    throw err
  }
  const err = new Error(`YouTube extraction failed: ${msg}`)
  err.statusCode = 502
  throw err
}

module.exports = { extractAudio, updateYtdlp }
