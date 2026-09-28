import { Injectable } from '@nestjs/common';

/**
 * Foundation only. Will depend on RoleService/PermissionService and implement
 * `IAuthorizationService` once permission checks are built (Phase 2), backing
 * the future `@RequirePermission()` / `@RequireRole()` guards.
 */
@Injectable()
export class AuthorizationService {}
