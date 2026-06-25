import { createHmac } from 'crypto';
import { CryptoService } from './crypto.service';

const KEY = '0'.repeat(64); // 32 octets en hex

function makeService(encryptionKey = KEY): CryptoService {
  return new CryptoService({ encryptionKey, throttleTtl: 60, throttleLimit: 120, bcryptRounds: 12 });
}

describe('CryptoService', () => {
  const crypto = makeService();

  describe('chiffrement AES-256-GCM', () => {
    it('effectue un aller-retour chiffrer/déchiffrer', () => {
      const secret = 'sk_live_super_secret';
      const encrypted = crypto.encrypt(secret);
      expect(encrypted).not.toContain(secret);
      expect(encrypted.split(':')).toHaveLength(3);
      expect(crypto.decrypt(encrypted)).toBe(secret);
    });

    it('produit des chiffrés différents à chaque appel (IV aléatoire)', () => {
      const a = crypto.encrypt('x');
      const b = crypto.encrypt('x');
      expect(a).not.toBe(b);
      expect(crypto.decrypt(a)).toBe('x');
      expect(crypto.decrypt(b)).toBe('x');
    });

    it('échoue à déchiffrer un contenu altéré (tag GCM invalide)', () => {
      const enc = crypto.encrypt('données');
      const [iv, tag, data] = enc.split(':');
      // Données altérées -> l'authentification GCM doit échouer.
      const tamperedData = `${iv}:${tag}:${Buffer.from('autre-contenu').toString('base64')}`;
      expect(() => crypto.decrypt(tamperedData)).toThrow();
      // Tag d'authentification altéré -> l'authentification GCM doit échouer.
      const wrongTag = Buffer.alloc(16, 0).toString('base64');
      expect(() => crypto.decrypt(`${iv}:${wrongTag}:${data}`)).toThrow();
    });
  });

  describe('HMAC-SHA256', () => {
    it('correspond au vecteur de référence node:crypto', () => {
      const expected = createHmac('sha256', 'secret').update('payload').digest('hex');
      expect(crypto.hmacSha256('payload', 'secret')).toBe(expected);
    });
  });

  describe('safeCompare', () => {
    it('renvoie vrai pour des chaînes identiques', () => {
      expect(crypto.safeCompare('abc123', 'abc123')).toBe(true);
    });
    it('renvoie faux pour des chaînes différentes ou de longueurs différentes', () => {
      expect(crypto.safeCompare('abc', 'abd')).toBe(false);
      expect(crypto.safeCompare('abc', 'abcd')).toBe(false);
    });
  });

  describe('jetons & hachage', () => {
    it('génère des jetons aléatoires de la bonne longueur', () => {
      expect(crypto.randomToken(16)).toHaveLength(32); // 16 octets -> 32 hex
      expect(crypto.randomToken()).not.toBe(crypto.randomToken());
    });
    it('hache de façon déterministe en SHA-256', () => {
      expect(crypto.sha256('a')).toBe(crypto.sha256('a'));
      expect(crypto.sha256('a')).not.toBe(crypto.sha256('b'));
    });
  });
});
