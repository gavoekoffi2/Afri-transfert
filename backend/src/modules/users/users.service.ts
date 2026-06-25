import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Vue publique d'un utilisateur (sans secrets).
 */
export type PublicUser = Omit<User, 'passwordHash' | 'twoFactorSecret'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Retire les champs sensibles avant exposition. */
  static toPublic(user: User): PublicUser {
    const { passwordHash: _p, twoFactorSecret: _t, ...rest } = user;
    return rest;
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  findByPhone(phone: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  markEmailVerified(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { emailVerifiedAt: new Date(), status: UserStatus.ACTIVE },
    });
  }

  markPhoneVerified(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { phoneVerifiedAt: new Date() },
    });
  }

  updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { passwordHash } });
  }

  updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }
}
