import { describe, expect, it } from 'vitest'

import { hasRole } from '@/access/roles'

describe('hasRole', () => {
  it('is false when nobody is signed in', () => {
    expect(hasRole(null, 'admin', 'editor')).toBe(false)
    expect(hasRole(undefined, 'admin')).toBe(false)
  })

  it('is false for a user without a role', () => {
    expect(hasRole({ role: null }, 'admin', 'editor')).toBe(false)
  })

  it('matches only the roles asked for', () => {
    expect(hasRole({ role: 'admin' }, 'admin')).toBe(true)
    expect(hasRole({ role: 'editor' }, 'admin')).toBe(false)
    expect(hasRole({ role: 'editor' }, 'admin', 'editor')).toBe(true)
  })
})
