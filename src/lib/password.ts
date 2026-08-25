/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Password hashing helper (SHA-256 + per-record salt) using Web Crypto.
 * Format stored: `sha256$<salt>$<hex>`
 *
 * Legacy plaintext values (from earlier builds) are still recognised so that
 * already-registered users are not locked out; they are re-hashed on next save.
 */

const HEX = '0123456789abcdef';

function toHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += HEX[(bytes[i] >> 4) & 0xf] + HEX[bytes[i] & 0xf];
  }
  return out;
}

function generateSalt(): string {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return toHex(arr);
}

export async function hashPassword(password: string, salt?: string): Promise<string> {
  const s = salt || generateSalt();
  const data = new TextEncoder().encode(`${s}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return `sha256$${s}$${toHex(new Uint8Array(digest))}`;
}

/** True if the stored value is already in our `sha256$...` format. */
export function isHashed(stored: string): boolean {
  return typeof stored === 'string' && stored.startsWith('sha256$') && stored.split('$').length === 3;
}

/** Verify a password against a stored value (hashed or legacy plaintext). */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  if (isHashed(stored)) {
    const [, salt, hash] = stored.split('$');
    const computed = await hashPassword(password, salt);
    return computed === stored;
  }
  // Legacy plaintext fallback (pre-hash builds). Kept temporarily so existing
  // users can still log in; creators/editors now always store hashed values.
  return stored === password;
}
