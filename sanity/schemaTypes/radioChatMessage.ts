import {defineField, defineType} from 'sanity'

export const radioChatMessage = defineType({
  name: 'radioChatMessage',
  title: 'Radio Chat Message',
  type: 'document',
  liveEdit: true,
  fields: [
    defineField({
      name: 'nickname',
      title: 'Nickname',
      type: 'string',
      validation: (rule) => rule.required().max(20),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'string',
      validation: (rule) => rule.required().max(280),
    }),
  ],
  preview: {
    select: {title: 'nickname', subtitle: 'message'},
  },
})
