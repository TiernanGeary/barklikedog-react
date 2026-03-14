import {defineField, defineType} from 'sanity'

export const radioQueue = defineType({
  name: 'radioQueue',
  title: 'Radio Queue',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'Radio Queue',
    }),
    defineField({
      name: 'tracks',
      title: 'Track Queue',
      description: 'Drag to reorder. Liquidsoap reads this list to decide what plays next.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'queuedTrack',
          fields: [
            defineField({
              name: 'trackRef',
              title: 'Track',
              type: 'reference',
              to: [{type: 'media'}],
              options: {filter: 'mediaType == "audio"'},
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Display Label',
              type: 'string',
              description: 'Override label shown to listeners (leave blank to use track title)',
            }),
          ],
          preview: {
            select: {
              title: 'trackRef.title',
              label: 'label',
              media: 'trackRef.featuredImage',
            },
            prepare({title, label, media}) {
              return {
                title: label || title || 'Untitled Track',
                media,
              }
            },
          },
        },
      ],
    }),
    defineField({
      name: 'loopPlaylist',
      title: 'Loop Playlist',
      type: 'boolean',
      description: 'When the queue ends, start over from the beginning',
      initialValue: true,
    }),
    defineField({
      name: 'currentTrackIndex',
      title: 'Current Track Index',
      type: 'number',
      description: 'Set by the sync service — do not edit manually',
      readOnly: true,
      initialValue: 0,
    }),
    defineField({
      name: 'currentTrackStartedAt',
      title: 'Current Track Started At',
      type: 'datetime',
      description: 'When the current track started playing',
      readOnly: true,
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
