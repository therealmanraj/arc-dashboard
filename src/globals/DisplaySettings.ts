import type { GlobalConfig } from 'payload'

import { isAdmin } from '@/access'

// Step 1 holds only the display key. Slides, schedule and the reset button come in build plan step 7.
export const DisplaySettings: GlobalConfig = {
  slug: 'display-settings',
  label: 'Display settings',
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'displayKeyHash',
      type: 'text',
      // Never sent to the admin panel or the API. Set with `pnpm display:key`.
      hidden: true,
    },
  ],
}
