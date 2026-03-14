import {defineField, defineType} from 'sanity'

export const radioSettings = defineType({
  name: 'radioSettings',
  title: 'Radio Settings',
  type: 'document',
  liveEdit: true,
  fields: [
    defineField({
      name: 'moderationEnabled',
      title: 'Moderation Enabled',
      type: 'boolean',
      description: 'When enabled, listener uploads go to "pending" status and must be approved',
      initialValue: false,
    }),
    defineField({
      name: 'maxUploadSizeMB',
      title: 'Max Upload Size (MB)',
      type: 'number',
      description: 'Maximum file size for listener uploads',
      initialValue: 50,
      validation: (rule) => rule.min(1).max(500),
    }),
    defineField({
      name: 'uploadsEnabled',
      title: 'Uploads Enabled',
      type: 'boolean',
      description: 'When disabled, listeners cannot add tracks',
      initialValue: true,
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Radio Settings'}
    },
  },
})
