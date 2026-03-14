import {defineField, defineType} from 'sanity'

export const radioSkipVote = defineType({
  name: 'radioSkipVote',
  title: 'Radio Skip Vote',
  type: 'document',
  liveEdit: true,
  fields: [
    defineField({
      name: 'songTitle',
      title: 'Current Song Title',
      type: 'string',
    }),
    defineField({
      name: 'voteCount',
      title: 'Vote Count',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'voterHashes',
      title: 'Voter Hashes',
      type: 'array',
      of: [{type: 'string'}],
    }),
  ],
  preview: {
    select: {title: 'songTitle', count: 'voteCount'},
    prepare({title, count}) {
      return {title: `Skip Votes: ${title || '(none)'}`, subtitle: `${count || 0} votes`}
    },
  },
})
