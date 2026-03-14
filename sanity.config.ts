'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `/app/studio/[[...tool]]/page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schemaTypes'
import {structure} from './sanity/structure'
import {skipTrackAction} from './sanity/actions/skipTrack'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema,
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'radioQueue' || context.schemaType === 'radioSettings') {
        return [skipTrackAction, ...prev]
      }
      return prev
    },
  },
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
