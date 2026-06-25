import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { jwtConfig, securityConfig } from '../../config/configuration';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    PassportModule,
    JwtModule.register({}),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(securityConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokensService, JwtStrategy],
  exports: [AuthService, TokensService],
})
export class AuthModule {}
