import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IDENTITY_RESOLVER, REQUIRED_PERMISSIONS_KEY } from '../../constants';
import { UserService } from '../../user/user.service';
import { AuthorizationService } from '../authorization.service';
import type { IIdentityResolver } from '../interfaces/identity-resolver.interface';
import { BaseAuthorizationGuard } from './base-authorization.guard';

/** Enforces `@RequirePermission(...)`: the caller must hold every listed permission. */
@Injectable()
export class PermissionGuard extends BaseAuthorizationGuard {
  constructor(
    reflector: Reflector,
    @Inject(IDENTITY_RESOLVER) identityResolver: IIdentityResolver,
    userService: UserService,
    private readonly authorizationService: AuthorizationService,
  ) {
    super(reflector, identityResolver, userService, REQUIRED_PERMISSIONS_KEY);
  }

  protected async check(userId: string, required: string[]): Promise<void> {
    const held = new Set(
      (await this.authorizationService.getUserPermissions(userId)).map(
        (permission) => permission.code,
      ),
    );
    const missing = required.filter((code) => !held.has(code));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Missing required permission(s): ${missing.join(', ')}`,
      );
    }
  }
}
