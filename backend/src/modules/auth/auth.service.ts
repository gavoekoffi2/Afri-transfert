import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TokenType, User, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { securityConfig } from '../../config/configuration';
import { NotificationsService } from '../notifications/notifications.service';
import { PublicUser, UsersService } from '../users/users.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { TokenPair, TokensService } from './tokens.service';

interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

// Hash bcrypt bien formé, comparé lorsqu'aucun utilisateur n'est trouvé afin
// d'égaliser le temps de réponse (anti-énumération de comptes par timing).
const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO3WDlbg8aEKv0Vl1n6X3i1f0vXqLZ8mq';

const EMAIL_TOKEN_TTL = 24 * 3600; // 24 h
const RESET_TOKEN_TTL = 3600; // 1 h
const PHONE_OTP_TTL = 10 * 60; // 10 min

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokensService,
    private readonly notifications: NotificationsService,
    @Inject(securityConfig.KEY) private readonly security: ConfigType<typeof securityConfig>,
  ) {}

  // ------------------------------------------------------------------- INSCRIPTION
  async register(dto: RegisterDto, ctx: RequestContext): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const email = dto.email.toLowerCase();
    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }
    if (dto.phone && (await this.users.findByPhone(dto.phone))) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.security.bcryptRounds);
    const user = await this.users.create({
      email,
      phone: dto.phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      countryIso2: dto.countryIso2,
      passwordHash,
      status: UserStatus.PENDING,
    });

    await this.sendEmailVerification(user);

    const tokens = await this.issueTokens(user, ctx);
    return { user: UsersService.toPublic(user), tokens };
  }

  // ------------------------------------------------------------------- CONNEXION
  async login(dto: LoginDto, ctx: RequestContext): Promise<{ user: PublicUser; tokens: TokenPair }> {
    const user = await this.users.findByEmail(dto.email);
    // Comparaison systématique pour limiter l'énumération de comptes (timing).
    const ok = user
      ? await bcrypt.compare(dto.password, user.passwordHash)
      : await bcrypt.compare(dto.password, DUMMY_HASH);

    if (!user || !ok) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }
    if (user.status === UserStatus.BLOCKED || user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Compte désactivé. Contactez le support.');
    }

    // Architecture 2FA prête : si activé, un code TOTP valide est requis.
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        throw new UnauthorizedException('Code d\'authentification à deux facteurs requis');
      }
      if (!this.verifyTwoFactor(user, dto.twoFactorCode)) {
        throw new UnauthorizedException('Code 2FA invalide');
      }
    }

    await this.users.updateLastLogin(user.id);
    const tokens = await this.issueTokens(user, ctx);
    return { user: UsersService.toPublic(user), tokens };
  }

  async refresh(refreshToken: string, ctx: RequestContext): Promise<TokenPair> {
    return this.tokens.rotateRefreshToken(refreshToken, ctx);
  }

  async logout(userId: string): Promise<void> {
    await this.tokens.revokeAllUserSessions(userId);
  }

  // ------------------------------------------------------------------- EMAIL
  async sendEmailVerification(user: User): Promise<void> {
    const token = await this.tokens.createVerificationToken(
      user.id,
      TokenType.EMAIL_VERIFICATION,
      EMAIL_TOKEN_TTL,
    );
    await this.notifications.sendEmailVerification(user.email, user.firstName, token);
  }

  async verifyEmail(token: string): Promise<PublicUser> {
    const userId = await this.tokens.consumeToken(token, TokenType.EMAIL_VERIFICATION);
    const user = await this.users.markEmailVerified(userId);
    await this.notifications.sendWelcome(user.email, user.firstName);
    return UsersService.toPublic(user);
  }

  // ------------------------------------------------------------------- TÉLÉPHONE
  async requestPhoneVerification(userId: string, phone?: string): Promise<void> {
    const user = await this.users.findByIdOrFail(userId);
    const target = phone ?? user.phone;
    if (!target) {
      throw new BadRequestException('Aucun numéro de téléphone à vérifier');
    }
    if (phone && phone !== user.phone) {
      await this.users.update(userId, { phone });
    }
    const code = await this.tokens.createOtpCode(userId, TokenType.PHONE_VERIFICATION, PHONE_OTP_TTL);
    await this.notifications.sendPhoneOtp(target, code);
  }

  async verifyPhone(userId: string, code: string): Promise<PublicUser> {
    const ownerId = await this.tokens.consumeToken(code, TokenType.PHONE_VERIFICATION);
    if (ownerId !== userId) {
      throw new UnauthorizedException('Code invalide');
    }
    const user = await this.users.markPhoneVerified(userId);
    return UsersService.toPublic(user);
  }

  // ------------------------------------------------------------------- MOT DE PASSE
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.users.findByEmail(dto.email);
    // Réponse identique que le compte existe ou non (anti-énumération).
    if (!user) {
      this.logger.debug(`Demande de réinitialisation pour un email inconnu : ${dto.email}`);
      return;
    }
    const token = await this.tokens.createVerificationToken(
      user.id,
      TokenType.PASSWORD_RESET,
      RESET_TOKEN_TTL,
    );
    await this.notifications.sendPasswordReset(user.email, user.firstName, token);
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const userId = await this.tokens.consumeToken(dto.token, TokenType.PASSWORD_RESET);
    const passwordHash = await bcrypt.hash(dto.password, this.security.bcryptRounds);
    await this.users.updatePassword(userId, passwordHash);
    // Invalide toutes les sessions existantes par sécurité.
    await this.tokens.revokeAllUserSessions(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.users.findByIdOrFail(userId);
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, this.security.bcryptRounds);
    await this.users.updatePassword(userId, passwordHash);
    await this.tokens.revokeAllUserSessions(userId);
  }

  // ------------------------------------------------------------------- PRIVÉ
  private issueTokens(user: User, ctx: RequestContext): Promise<TokenPair> {
    return this.tokens.issueTokenPair(
      { sub: user.id, email: user.email, role: user.role, type: 'user' },
      ctx,
    );
  }

  /**
   * Point d'extension 2FA. L'architecture (champ `twoFactorEnabled` + secret chiffré)
   * est prête ; brancher ici une librairie TOTP (ex: otplib) pour la vérification réelle.
   */
  private verifyTwoFactor(_user: User, _code: string): boolean {
    // TODO: otplib.authenticator.verify({ token: code, secret: decrypt(user.twoFactorSecret) })
    return false;
  }
}
