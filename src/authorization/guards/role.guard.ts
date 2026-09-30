import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IDENTITY_RESOLVER, REQUIRED_ROLES_KEY } from '../../constants';
import { UserService } from '../../user/user.service';
import { AuthorizationService } from '../authorization.service';
import type { IIdentityResolver } from '../interfaces/identity-resolver.interface';
import { BaseAuthorizationGuard } from './base-authorization.guard';

/**
 * Enforces `@RequireRole(...)`: the caller must hold every listed role
 * (by role `code`). Only active roles of an active user count, as resolved
 * by `AuthorizationService.getUserRoles`.
 */
@Injectable()
export class RoleGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    @Inject(IDENTITY_RESOLVER) identityResolver: IIdentityResolver,
    userService: UserService,
    private readonly authorizationService: AuthorizationService,
  ) {
    super(reflector, identityResolver, userService, REQUIRED_ROLES_KEY);
  }

  protected async check(userId: string, required: string[]): Promise<void> {
    const held = new Set(
      (await this.authorizationService.getUserRoles(userId)).map(
        (role) => role.code,
      ),
    );
    const missing = required.filter((code) => !held.has(code));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Missing required role(s): ${missing.join(', ')}`,
      );
    }
  }
}
