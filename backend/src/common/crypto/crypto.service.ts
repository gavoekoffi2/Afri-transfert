import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'crypto';
import { securityConfig } from '../../config/configuration';

/**
 * Service cryptographique transverse.
 *
 *  - Chiffrement symétrique AES-256-GCM des secrets stockés (clés API, secrets 2FA…).
 *  - Génération et vérification de HMAC-SHA256 (signatures webhook).
 *  - Génération de jetons aléatoires sûrs + hachage SHA-256 pour stockage.
 *
 * La clé de chiffrement provient de `ENCRYPTION_KEY` (hex, 32 octets).
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;
  private static readonly IV_LENGTH = 12; // recommandé pour GCM
  private static readonly AUTH_TAG_LENGTH = 16;

  constructor(
    @Inject(securityConfig.KEY)
    private readonly security: ConfigType<typeof securityConfig>,
  ) {
    const raw = this.security.encryptionKey;
    // Accepte une clé hex de 64 caractères ; sinon dérive une clé via SHA-256 (dev).
    if (/^[0-9a-fA-F]{64}$/.test(raw)) {
      this.key = Buffer.from(raw, 'hex');
    } else if (raw) {
      this.key = createHash('sha256').update(raw).digest();
    } else {
      this.key = createHash('sha256').update('afritransfer-dev-key').digest();
    }
  }

  /**
   * Chiffre une chaîne en clair. Format de sortie : `iv:authTag:ciphertext` (base64).
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(CryptoService.IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  /**
   * Déchiffre une chaîne produite par `encrypt`.
   */
  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split(':');
    if (!ivB64 || !tagB64 || !dataB64) {
      throw new InternalServerErrorException('Format de secret chiffré invalide');
    }
    const decipher = createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  /**
   * Calcule un HMAC-SHA256 hexadécimal.
   */
  hmacSha256(data: string, secret: string): string {
    return createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Comparaison à temps constant (anti timing-attack) de deux signatures hex.
   */
  safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }

  /**
   * Jeton aléatoire URL-safe (par défaut 32 octets).
   */
  randomToken(bytes = 32): string {
    return randomBytes(bytes).toString('hex');
  }

  /**
   * Hachage SHA-256 (pour stocker un jeton sans le conserver en clair).
   */
  sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
