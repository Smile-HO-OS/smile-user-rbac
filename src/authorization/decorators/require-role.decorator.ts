import { SetMetadata } from '@nestjs/common';
import { REQUIRED_ROLES_KEY } from '../../constants';

/**
 * Requires the caller to hold roles (matched by role `code`), enforced by
 * `RoleGuard`. With several codes the caller must hold **all** of them. A
 * method-level decorator replaces (does not merge with) a class-level one.
 */
export const RequireRole = (...roleCodes: string[]) =>
  SetMetadata(REQUIRED_ROLES_KEY, roleCodes);
