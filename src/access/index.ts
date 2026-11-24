import type { Access, FieldAccess } from 'payload'

import { hasRole } from './roles'

export { hasRole, ROLES, type Role } from './roles'

export const isAdmin: Access = ({ req: { user } }) => hasRole(user, 'admin')

export const isAdminOrEditor: Access = ({ req: { user } }) => hasRole(user, 'admin', 'editor')

/** Admins see every user; anyone else only their own record. */
export const isAdminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (hasRole(user, 'admin')) return true
  return { id: { equals: user.id } }
}

export const isAdminField: FieldAccess = ({ req: { user } }) => hasRole(user, 'admin')
