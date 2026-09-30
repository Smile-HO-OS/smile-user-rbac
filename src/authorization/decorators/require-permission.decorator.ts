import { SetMetadata } from '@nestjs/common';
import { REQUIRED_PERMISSIONS_KEY } from '../../constants';

/**
 * Requires the caller to hold permissions, enforced by `PermissionGuard`.
 * With several codes the caller must hold **all** of them. A method-level
 * decorator replaces (does not merge with) a class-level one.
 */
export const RequirePermission = (...permissionCodes: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissionCodes);
