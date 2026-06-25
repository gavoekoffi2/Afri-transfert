import { randomBytes } from 'crypto';

/**
 * Génère une référence de transaction interne AfriTransfer : `ATR-XXXXXXXXXX`
 * (10 caractères alphanumériques majuscules, sans caractères ambigus).
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I, O, 0, 1

export function generateTransactionReference(): string {
  const bytes = randomBytes(10);
  let out = '';
  for (let i = 0; i < 10; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `ATR-${out}`;
}
