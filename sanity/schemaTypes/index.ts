import { type SchemaTypeDefinition } from 'sanity'
import { product } from './product'
import { post } from './post'
import { media } from './media'
import { category } from './category'
import { page } from './page'
import { blockContent } from './blockContent'
import { siteSettings } from './siteSettings'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [siteSettings, product, post, media, category, page, blockContent],
}
