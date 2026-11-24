import { getPayload } from 'payload'

import config from '@payload-config'
import { buildDisplayFeed, type FeedSourceGrant } from '@/lib/displayFeed'
import { verifyDisplayKey } from '@/lib/displayKey'

export const dynamic = 'force-dynamic'

const notFound = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })

/** GET /api/display/feed?key=… : display-safe data for the TV. Read-only. */
export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({ config })

  const key = new URL(request.url).searchParams.get('key')
  const settings = await payload.findGlobal({
    slug: 'display-settings',
    overrideAccess: true,
    showHiddenFields: true,
  })
  if (!verifyDisplayKey(key, settings.displayKeyHash)) return notFound()

  // Filter in the query (CLAUDE.md): only grants shown on the TV, and only the statuses the TV uses.
  const { docs } = await payload.find({
    collection: 'grants',
    where: {
      and: [{ showOnDisplay: { equals: true } }, { status: { in: ['active', 'completed'] } }],
    },
    depth: 1,
    pagination: false,
    overrideAccess: true,
    select: {
      title: true,
      shortDescription: true,
      funder: true,
      area: true,
      status: true,
      showOnDisplay: true,
      amountCents: true,
      startDate: true,
      endDate: true,
      completedAt: true,
      studentsInvolved: true,
      partner: true,
      hidePartnerOnDisplay: true,
      outcomeHighlight: true,
    },
  })

  const feed = buildDisplayFeed(docs as FeedSourceGrant[], new Date())
  return Response.json(feed, { headers: { 'Cache-Control': 'no-store' } })
}
