export const ROLES = ['admin', 'editor'] as const
export type Role = (typeof ROLES)[number]

type MaybeUser = { role?: Role | null } | null | undefined

/** True when the user is signed in and has one of the given roles. */
export function hasRole(user: MaybeUser, ...roles: Role[]): boolean {
  return Boolean(user?.role && roles.includes(user.role))
}
