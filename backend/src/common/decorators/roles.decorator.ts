import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restreint une route aux rôles admin indiqués (utilisé avec le RolesGuard).
 * Ex : `@Roles('SUPER_ADMIN', 'ADMIN')`.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
