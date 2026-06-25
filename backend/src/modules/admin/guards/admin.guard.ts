import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

/**
 * Garantit que le jeton présenté est un jeton d'administrateur (`type === 'admin'`).
 * À combiner avec le JwtAuthGuard global et, le cas échéant, le RolesGuard.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!user || user.type !== 'admin') {
      throw new ForbiddenException('Accès réservé à l\'administration');
    }
    return true;
  }
}
