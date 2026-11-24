import { pickList } from './pickList'

export const Funders = pickList({
  slug: 'funders',
  singular: 'Funder',
  plural: 'Funders',
  referencedBy: [{ collection: 'grants', field: 'funder', noun: ['grant', 'grants'] }],
})
