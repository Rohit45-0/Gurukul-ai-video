import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, existing] = storedHash.split(':');

  if (!salt || !existing) {
    return false;
  }

  const derived = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(existing, 'hex'), Buffer.from(derived, 'hex'));
}
