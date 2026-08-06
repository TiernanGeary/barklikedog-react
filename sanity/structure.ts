import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
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
      // Products sorted by order
      S.listItem()
        .title('Products')
        .id('product')
        .child(
          S.documentList()
            .title('Products')
            .filter('_type == "product"')
            .defaultOrdering([{field: 'order', direction: 'asc'}])
        ),
      // All other document types except singletons and product
      ...S.documentTypeListItems().filter(
        (item) => !['siteSettings', 'radioSettings', 'product'].includes(item.getId() ?? '')
      ),
    ])
