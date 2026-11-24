// Creates a new display key, stores its hash, and prints the TV link once.
// The old key stops working immediately. Usage: pnpm display:key
import { getPayload } from 'payload'

import config from '@payload-config'
import { generateDisplayKey, hashDisplayKey } from '@/lib/displayKey'

const payload = await getPayload({ config })
const key = generateDisplayKey()

await payload.updateGlobal({
  slug: 'display-settings',
  data: { displayKeyHash: hashDisplayKey(key) },
  overrideAccess: true,
})

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
console.log('\nNew display key saved. The old link no longer works.')
console.log('Open this link on the TV (keep it private; it is shown only now):\n')
console.log(`  ${serverURL}/display?key=${key}\n`)
process.exit(0)
