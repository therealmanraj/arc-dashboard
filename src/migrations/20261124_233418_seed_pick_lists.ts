import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

// Starting values for the pick lists (docs/data-model.md). Admins can change them afterwards.
// Values are frozen here on purpose: later edits to the lists must not change this migration.
const FUNDERS = ['NSERC', 'SSHRC', 'Mitacs', 'CFI', 'BCKDF', 'DFO', 'ESDC', 'Private', 'Other']
const ENGAGEMENT_TYPES = [
  'Federally funded partnership',
  'Contract research',
  'Limited engagement',
  'Capstone',
]

type PickListSlug = 'funders' | 'engagement-types'

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const lists: Array<[PickListSlug, string[]]> = [
    ['funders', FUNDERS],
    ['engagement-types', ENGAGEMENT_TYPES],
  ]
  for (const [collection, names] of lists) {
    for (const [index, name] of names.entries()) {
      await payload.create({ collection, data: { name, sortOrder: (index + 1) * 10 }, req })
    }
  }
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.delete({ collection: 'funders', where: { name: { in: FUNDERS } }, req })
  await payload.delete({
    collection: 'engagement-types',
    where: { name: { in: ENGAGEMENT_TYPES } },
    req,
  })
}
