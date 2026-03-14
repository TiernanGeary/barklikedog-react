import {useCallback, useState} from 'react'
import type {DocumentActionComponent} from 'sanity'

export const skipTrackAction: DocumentActionComponent = () => {
  const [skipping, setSkipping] = useState(false)

  const onHandle = useCallback(async () => {
    setSkipping(true)
    try {
      await fetch('/api/radio/skip', {method: 'POST'})
    } catch (err) {
      console.error('Skip failed:', err)
    }
    setTimeout(() => setSkipping(false), 2000)
  }, [])

  return {
    label: skipping ? 'Skipping...' : 'Skip Track',
    onHandle,
    disabled: skipping,
    tone: 'caution',
  }
}
