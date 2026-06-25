import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { jwtConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminLoginDto } from './dto/admin.dto';

/**
 * Authentification des administrateurs (table `admins`, distincte des utilisateurs).
 * Émet un jeton d'accès JWT marqué `type: 'admin'`.
 */
@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(jwtConfig.KEY) private readonly config: ConfigType<typeof jwtConfig>,
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email.toLowerCase() } });
    const ok = admin
      ? await bcrypt.compare(dto.password, admin.passwordHash)
      : await bcrypt.compare(dto.password, '$2a$12$C6UzMDM.H6dfI/f/IKcEeO3WDlbg8aEKv0Vl1n6X3i1f0vXqLZ8mq');

    if (!admin || !ok || !admin.isActive) {
      throw new UnauthorizedException('Identifiants administrateur invalides');
    }

    await this.prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

    const accessToken = await this.jwt.signAsync(
      { sub: admin.id, email: admin.email, role: admin.role, type: 'admin' },
      { secret: this.config.accessSecret, expiresIn: this.config.accessTtl },
    );

    return {
      accessToken,
      expiresIn: this.config.accessTtl,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    };
  }
}
