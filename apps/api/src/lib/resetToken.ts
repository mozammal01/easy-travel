import { createHash, randomBytes } from 'node:crypto';

export function generateResetToken() {
  const rawToken = randomBytes(32).toString('hex');
  return { rawToken, tokenHash: hashResetToken(rawToken) };
}

export function hashResetToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
