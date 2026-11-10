import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
// A valid scrypt hash used only to keep unknown-email login attempts on the
// same expensive verification path as attempts for existing users.
const DUMMY_PASSWORD_HASH =
  "00000000000000000000000000000000:c8d7e1083974912b1c25eeff7c131fa3d3fb273ded2437e4f2591a7dcc37549a3f3c71d86e858a025f5285fae1a6c4dbb93550820546a9165e38a670ca76faa0";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const hashBuffer = Buffer.from(hash, "hex");
  const derivedBuffer = scryptSync(password, salt, KEY_LENGTH);

  if (hashBuffer.length !== derivedBuffer.length) return false;
  return timingSafeEqual(hashBuffer, derivedBuffer);
}

export function verifyPasswordForUser(password: string, stored: string | undefined): boolean {
  const matches = verifyPassword(password, stored ?? DUMMY_PASSWORD_HASH);
  return stored !== undefined && matches;
}
