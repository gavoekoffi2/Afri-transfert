import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConfig } from '../../../config/configuration';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'user' | 'admin';
}

/**
 * Stratégie d'authentification par jeton d'accès JWT (header Authorization: Bearer).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY)
    jwt: ConfigType<typeof jwtConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.accessSecret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      type: payload.type ?? 'user',
    };
  }
}
