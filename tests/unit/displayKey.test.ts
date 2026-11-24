import { describe, expect, it } from 'vitest'

import { generateDisplayKey, hashDisplayKey, verifyDisplayKey } from '@/lib/displayKey'

describe('display key', () => {
  it('generates long, URL-safe, different keys', () => {
    const a = generateDisplayKey()
    const b = generateDisplayKey()
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(a).not.toBe(b)
  })

  it('stores a hash, not the key', () => {
    const key = generateDisplayKey()
    expect(hashDisplayKey(key)).toMatch(/^[0-9a-f]{64}$/)
    expect(hashDisplayKey(key)).not.toContain(key)
  })

  it('accepts only the matching key', () => {
    const key = generateDisplayKey()
    const hash = hashDisplayKey(key)
    expect(verifyDisplayKey(key, hash)).toBe(true)
    expect(verifyDisplayKey(generateDisplayKey(), hash)).toBe(false)
    expect(verifyDisplayKey(key.slice(0, -1), hash)).toBe(false)
  })

  it('rejects a missing key, a missing hash, or a malformed hash', () => {
    const key = generateDisplayKey()
    expect(verifyDisplayKey(null, hashDisplayKey(key))).toBe(false)
    expect(verifyDisplayKey('', hashDisplayKey(key))).toBe(false)
    expect(verifyDisplayKey(key, null)).toBe(false)
    expect(verifyDisplayKey(key, 'not-a-hash')).toBe(false)
  })
})
