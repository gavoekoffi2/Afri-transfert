import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedUser {
  sub: string; // id utilisateur
  email: string;
  role: string;
  type: 'user' | 'admin';
}

/**
 * Injecte l'utilisateur authentifié (issu du JWT) dans un paramètre de contrôleur.
 * Usage : `@CurrentUser() user: AuthenticatedUser` ou `@CurrentUser('sub') id: string`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return data ? user?.[data] : user;
  },
);
