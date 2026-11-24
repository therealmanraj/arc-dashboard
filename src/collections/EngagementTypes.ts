import { pickList } from './pickList'

export const EngagementTypes = pickList({
  slug: 'engagement-types',
  singular: 'Engagement type',
  plural: 'Engagement types',
  referencedBy: [{ collection: 'grants', field: 'engagementType', noun: ['grant', 'grants'] }],
})
