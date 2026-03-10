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
      // All other document types except siteSettings
      ...S.documentTypeListItems().filter(
        (item) => item.getId() !== 'siteSettings'
      ),
    ])
