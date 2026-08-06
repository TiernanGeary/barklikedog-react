import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'comingSoon',
      title: 'Coming Soon Mode',
      type: 'boolean',
      description: 'When enabled, visitors see the coming soon page instead of the site.',
      initialValue: true,
    }),
    defineField({
      name: 'freeShipping',
      title: 'Free Shipping',
      type: 'boolean',
      description: 'When enabled, all orders ship free (no shipping charge at checkout).',
      initialValue: false,
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' }
    },
  },
})
