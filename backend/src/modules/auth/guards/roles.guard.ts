import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

/**
 * Vérifie que l'utilisateur authentifié possède l'un des rôles requis.
 * Utilisé avec `@Roles(...)` sur les routes admin.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Accès réservé aux administrateurs habilités');
    }
    return true;
  }
}
