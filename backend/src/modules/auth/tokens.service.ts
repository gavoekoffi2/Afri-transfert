import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenType } from '@prisma/client';
import { jwtConfig } from '../../config/configuration';
import { CryptoService } from '../../common/crypto/crypto.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface IssueContext {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Émission et validation des jetons :
 *  - paires access/refresh JWT (le refresh est aussi persisté sous forme de hash) ;
 *  - jetons de vérification email / réinitialisation (hash uniquement) ;
 *  - codes OTP téléphone.
 */
@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly prisma: PrismaService,
    @Inject(jwtConfig.KEY) private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  async issueTokenPair(payload: JwtPayload, ctx: IssueContext = {}): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.accessSecret,
      expiresIn: this.config.accessTtl,
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.refreshSecret,
      expiresIn: this.config.refreshTtl,
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: this.crypto.sha256(refreshToken),
        userAgent: ctx.userAgent,
        ipAddress: ctx.ipAddress,
        expiresAt: new Date(Date.now() + this.config.refreshTtl * 1000),
      },
    });

    return { accessToken, refreshToken, expiresIn: this.config.accessTtl };
  }

  /**
   * Valide un refresh token, le révoque et émet une nouvelle paire (rotation).
   */
  async rotateRefreshToken(refreshToken: string, ctx: IssueContext = {}): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const hash = this.crypto.sha256(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(
      { sub: payload.sub, email: payload.email, role: payload.role, type: payload.type },
      ctx,
    );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Crée un jeton de vérification/réinitialisation. Renvoie le jeton EN CLAIR
   * (à transmettre par email) ; seul son hash est stocké.
   */
  async createVerificationToken(userId: string, type: TokenType, ttlSeconds: number): Promise<string> {
    const raw = this.crypto.randomToken(32);
    await this.prisma.verificationToken.create({
      data: {
        userId,
        type,
        tokenHash: this.crypto.sha256(raw),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });
    return raw;
  }

  /**
   * Crée un code OTP numérique court (téléphone). Renvoie le code en clair.
   */
  async createOtpCode(userId: string, type: TokenType, ttlSeconds: number, digits = 6): Promise<string> {
    const code = Array.from({ length: digits }, () => Math.floor(Math.random() * 10)).join('');
    await this.prisma.verificationToken.create({
      data: {
        userId,
        type,
        tokenHash: this.crypto.sha256(code),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });
    return code;
  }

  /**
   * Valide et consomme un jeton/code. Renvoie l'userId associé.
   */
  async consumeToken(rawValue: string, type: TokenType): Promise<string> {
    const hash = this.crypto.sha256(rawValue);
    const token = await this.prisma.verificationToken.findFirst({
      where: { tokenHash: hash, type, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!token || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Jeton invalide ou expiré');
    }
    await this.prisma.verificationToken.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });
    return token.userId;
  }
}
