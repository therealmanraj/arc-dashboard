import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isAdmin } from '@/access'
import { GRANT_SOURCES, isEndAfterStart, nextCompletedAt } from '@/lib/grants'
import type { Grant } from '@/payload-types'

const setCompletedAt: CollectionBeforeChangeHook<Grant> = ({ data, originalDoc }) => ({
  ...data,
  completedAt: nextCompletedAt({
    previousStatus: originalDoc?.status,
    nextStatus: data.status ?? originalDoc?.status,
    previousCompletedAt: originalDoc?.completedAt,
    now: new Date(),
  }),
})

const dayOnly = { date: { pickerAppearance: 'dayOnly' as const, displayFormat: 'MMM d, yyyy' } }

export const Grants: CollectionConfig = {
  slug: 'grants',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'funder', 'area', 'amountCents', 'endDate', 'status', 'showOnDisplay'],
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    // Archive instead of deleting (status: archived).
    delete: () => false,
  },
  indexes: [{ fields: ['source', 'externalId'], unique: true }],
  hooks: {
    beforeChange: [setCompletedAt],
  },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 200 },
    {
      name: 'shortDescription', label: 'Short description',
      type: 'textarea',
      maxLength: 200,
      admin: { description: 'Shown on the TV. Up to 200 characters.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'funder', type: 'relationship', relationTo: 'funders', required: true },
        { name: 'program', type: 'text' },
      ],
    },
    {
      name: 'amountCents',
      label: 'Amount (cents, CAD)',
      type: 'number',
      min: 0,
      admin: {
        step: 1,
        description: 'In cents: $250,000 is 25000000.',
      },
      validate: (value: number | null | undefined) =>
        value === null || value === undefined || Number.isInteger(value) || 'Enter a whole number of cents.',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'area',
          type: 'select',
          required: true,
          options: [
            { label: 'Natural products', value: 'natural-products' },
            { label: 'Data analytics', value: 'data-analytics' },
            { label: 'Social innovation', value: 'social-innovation' },
          ],
        },
        { name: 'engagementType', label: 'Engagement type', type: 'relationship', relationTo: 'engagement-types' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'facultyLead', label: 'Faculty lead', type: 'text' },
        { name: 'partner', type: 'text' },
      ],
    },
    {
      name: 'hidePartnerOnDisplay', label: 'Hide partner on display',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Keep the partner name off the TV.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'startDate', label: 'Start date', type: 'date', admin: dayOnly },
        {
          name: 'endDate', label: 'End date',
          type: 'date',
          admin: dayOnly,
          validate: (value: Date | string | null | undefined, { siblingData }: { siblingData: Partial<Grant> }) =>
            isEndAfterStart(siblingData?.startDate, value) || 'The end date must be after the start date.',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Active', value: 'active' },
            { label: 'Completed', value: 'completed' },
            { label: 'Archived', value: 'archived' },
          ],
        },
        {
          name: 'completedAt', label: 'Completed on',
          type: 'date',
          admin: { readOnly: true, description: 'Set when the status changes to Completed.' },
        },
      ],
    },
    {
      name: 'autoComplete', label: 'Auto-complete',
      type: 'checkbox',
      // TODO(step 8): default from AppSettings `autoCompleteDefault`.
      defaultValue: true,
      admin: { description: 'Mark as Completed automatically the day after the end date.' },
    },
    { name: 'studentsInvolved', label: 'Students involved', type: 'number', min: 0, admin: { step: 1 } },
    {
      name: 'outcomeHighlight', label: 'Outcome highlight',
      type: 'text',
      maxLength: 120,
      admin: { description: 'Shown on the Recently completed slide. Up to 120 characters.' },
    },
    { name: 'coverPhoto', label: 'Cover photo', type: 'upload', relationTo: 'media' },
    {
      name: 'showOnDisplay', label: 'Show on display',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Untick to keep this grant off the TV.' },
    },
    {
      type: 'collapsible',
      label: 'Source',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'source',
          type: 'select',
          defaultValue: 'manual',
          options: GRANT_SOURCES.map((value) => ({
            label: { manual: 'Manual', excel: 'Excel', dynamics365: 'Dynamics 365' }[value],
            value,
          })),
          admin: { readOnly: true },
        },
        { name: 'externalId', label: 'External ID', type: 'text', admin: { readOnly: true } },
        {
          name: 'lockedFields', label: 'Locked fields',
          type: 'json',
          admin: { readOnly: true, description: 'Phase 2: fields owned by Dynamics 365.' },
        },
      ],
    },
  ],
}
