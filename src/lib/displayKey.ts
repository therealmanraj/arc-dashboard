import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

/** A new random display key: 32 bytes, URL-safe. */
export function generateDisplayKey(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * The stored form of a display key. The key is long and random, so a plain SHA-256
 * is enough; it is not a password.
 */
export function hashDisplayKey(key: string): string {
  return createHash('sha256').update(key, 'utf8').digest('hex')
}

/** True when `key` matches the stored hash. Missing key or hash never matches. */
export function verifyDisplayKey(key: string | null | undefined, storedHash: string | null | undefined): boolean {
  if (!key || !storedHash) return false
  const actual = Buffer.from(hashDisplayKey(key), 'hex')
  const expected = Buffer.from(storedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
