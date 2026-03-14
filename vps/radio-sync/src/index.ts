import 'dotenv/config'
import { fetchQueue, listenToQueue } from './sanity.js'
import { syncQueueToAzuraCast, startNowPlayingSubscription } from './sync.js'

async function main() {
  console.log('[radio-sync] Starting...')

  // Initial sync
  const queue = await fetchQueue()
  if (queue) {
    await syncQueueToAzuraCast(queue)
  } else {
    console.log('[radio-sync] No queue found — waiting for changes')
  }

  // Listen for Sanity queue changes (only fires when tracks array changes)
  listenToQueue(async (queue) => {
    try {
      await syncQueueToAzuraCast(queue)
    } catch (err) {
      console.error('[radio-sync] Sync error:', err)
    }
  })

  // Subscribe to AzuraCast SSE for instant now-playing updates
  startNowPlayingSubscription()

  console.log('[radio-sync] Listening for queue changes + SSE now-playing...')
}

main().catch((err) => {
  console.error('[radio-sync] Fatal error:', err)
  process.exit(1)
})
