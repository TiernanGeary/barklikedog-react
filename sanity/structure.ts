import type {StructureResolver} from 'sanity/structure'
import {orderableDocumentListDeskItem} from '@sanity/orderable-document-list'

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Content')
    .items([
      // Site Settings as a singleton (not a list)
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Site Settings')
        ),
      S.divider(),
      // Radio Settings as a singleton
      S.listItem()
        .title('Radio Settings')
        .id('radioSettings')
        .child(
          S.document()
            .schemaType('radioSettings')
            .documentId('radioSettings')
            .title('Radio Settings')
        ),
      S.divider(),
      // Products with drag-to-reorder
      orderableDocumentListDeskItem({type: 'product', title: 'Products', S, context}),
      // All other document types except singletons and product
      ...S.documentTypeListItems().filter(
        (item) => !['siteSettings', 'radioSettings', 'product'].includes(item.getId() ?? '')
      ),
    ])
