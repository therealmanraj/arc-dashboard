import { APIError, type CollectionBeforeDeleteHook, type CollectionConfig, type CollectionSlug } from 'payload'

import { isAdmin, isAdminOrEditor } from '@/access'

type Reference = {
  /** Collection that points at this list, e.g. "grants". */
  collection: CollectionSlug
  /** Relationship field on that collection, e.g. "funder". */
  field: string
  /** Nouns for the error message, e.g. ["grant", "grants"]. */
  noun: [one: string, many: string]
}

type PickListOptions = {
  slug: CollectionSlug
  singular: string
  plural: string
  /** Where this list is used. Items in use can't be deleted. */
  referencedBy?: Reference[]
}

function blockDeleteWhenUsed(singular: string, references: Reference[]): CollectionBeforeDeleteHook {
  return async ({ id, req }) => {
    for (const { collection, field, noun } of references) {
      const { totalDocs } = await req.payload.count({
        collection,
        where: { [field]: { equals: id } },
        overrideAccess: true,
        req,
      })
      if (totalDocs > 0) {
        throw new APIError(
          `This ${singular.toLowerCase()} is used by ${totalDocs} ${totalDocs === 1 ? noun[0] : noun[1]}. Change ${totalDocs === 1 ? 'it' : 'those'} first, then delete it.`,
          400,
          null,
          true,
        )
      }
    }
  }
}

/**
 * A simple named list (funders, engagement types, post categories).
 * Read by admins and editors; changed by admins only.
 */
export function pickList({ slug, singular, plural, referencedBy = [] }: PickListOptions): CollectionConfig {
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
    hooks: {
      beforeDelete: referencedBy.length > 0 ? [blockDeleteWhenUsed(singular, referencedBy)] : [],
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
        label: 'Sort order',
        type: 'number',
        admin: { description: 'Lower numbers are listed first.' },
      },
    ],
  }
}
