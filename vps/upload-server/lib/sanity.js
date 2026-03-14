const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = process.env

/**
 * Upload a file buffer to the Sanity CDN.
 * Returns the full Sanity asset document response.
 */
async function uploadToSanityCDN(buffer, contentType = 'audio/mpeg') {
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2026-03-10/assets/files/${SANITY_DATASET}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      Authorization: `Bearer ${SANITY_API_TOKEN}`,
    },
    body: buffer,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sanity upload failed (${res.status}): ${text}`)
  }

  return res.json()
}

module.exports = { uploadToSanityCDN }
