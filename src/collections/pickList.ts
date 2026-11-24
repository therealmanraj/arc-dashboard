import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrEditor } from '@/access'

type PickListOptions = {
  slug: string
  singular: string
  plural: string
}

/**
 * A simple named list (funders, engagement types, post categories).
 * Read by admins and editors; changed by admins only.
 */
export function pickList({ slug, singular, plural }: PickListOptions): CollectionConfig {
  return {
    slug,
    labels: { singular, plural },
    admin: {
      useAsTitle: 'name',
      defaultColumns: ['name', 'sortOrder'],
    },
    defaultSort: 'sortOrder',
    access: {
      read: isAdminOrEditor,
      create: isAdmin,
      update: isAdmin,
      delete: isAdmin,
    },
    fields: [
      {
        name: 'name',
        type: 'text',
        required: true,
        unique: true,
      },
      {
        name: 'sortOrder',
        type: 'number',
        admin: { description: 'Lower numbers are listed first.' },
      },
    ],
  }
}
